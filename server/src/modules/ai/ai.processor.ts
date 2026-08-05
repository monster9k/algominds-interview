import { Processor, WorkerHost } from '@nestjs/bullmq';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
import { ChatGateway } from '../chat/chat/chat.gateway';
import { MessageSender, SessionStatus } from '@prisma/client';

interface ChatJobData {
  sessionId: string;
  userId: string;
  content: string;
}

interface EvaluateCodeJobData {
  submissionId?: string;
  sessionId: string;
  userId: string;
  code: string;
  language: string;
}

interface GradePeerInterviewJobData {
  peerSessionId: string;
}

type AiJobData = ChatJobData | EvaluateCodeJobData | GradePeerInterviewJobData;

@Processor('ai-queue')
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<AiJobData>): Promise<unknown> {
    const jobName = job.name;
    const data = job.data;

    const logId = 'sessionId' in data ? data.sessionId : data.peerSessionId;
    this.logger.log(`Processing ${jobName} for session: ${logId}`);

    if (jobName === 'chat-job') {
      return this.processChat(data as ChatJobData);
    } else if (jobName === 'evaluate-code') {
      return this.processEvaluateCode(data as EvaluateCodeJobData);
    } else if (jobName === 'grade-peer-interview') {
      return this.processGradePeerInterview(data as GradePeerInterviewJobData);
    } else {
      this.logger.warn(`Unknown job type: ${jobName}`);
    }
  }

  /**
   * PHASE 1-2: Chat Strategy Evaluation & Phase Transition
   */
  private async processChat(data: ChatJobData) {
    const { sessionId, content } = data;

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        problem: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
        // Chỉ dùng để lấy stage.personaId nếu session này thuộc 1 career
        // journey (P4) — không ảnh hưởng session ngoài career journey.
        journeyProgress: { include: { stage: true } },
      },
    });

    if (!session || !session.problem) return;

    // TẠO CONTEXT STRING
    const problem = session.problem;
    const problemContext = `
      Title: ${problem.title}
      Difficulty: ${problem.difficulty}
      Time Limit: ${problem.timeLimitMs}ms
      Memory Limit: ${problem.memoryLimitMb}MB
      Description (HTML/Markdown):
      ${problem.content}
      
      Initial Code Template:
      ${JSON.stringify(problem.initialCode)}
    `;

    // Format History
    const history = session.messages
      .filter((msg) => msg.content !== content)
      .map((msg) => ({
        role: msg.sender === 'AI' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })) as { role: 'user' | 'model'; parts: { text: string }[] }[];

    // personaId: chỉ có khi session thuộc 1 career journey (P4) — tham số
    // này AiService đã hỗ trợ sẵn từ trước, chỉ chưa từng được truyền ở đây.
    const personaId = session.journeyProgress?.stage?.personaId;

    // Gọi AI Service
    const rawAiResponse = await this.aiService.generateResponse(
      history,
      content,
      problemContext,
      personaId,
    );

    // PARSE JSON & XỬ LÝ LOGIC
    let aiMessageContent = '';
    let isApproved = false;
    // "hedging" | "neutral" | "assertive" — chỉ nhận đúng 3 giá trị đã định
    // nghĩa trong systemInstruction, giá trị lạ/thiếu -> null thay vì lưu rác
    // (Confidence Calibration Score — xem ai.service.ts).
    let confidenceSignal: string | null = null;
    const VALID_CONFIDENCE_SIGNALS = ['hedging', 'neutral', 'assertive'];

    try {
      const parsedResponse = JSON.parse(rawAiResponse) as {
        message?: string;
        status?: string;
        confidenceSignal?: string;
      };
      aiMessageContent = parsedResponse.message ?? '';
      const normalizedStatus = String(
        parsedResponse.status || '',
      ).toUpperCase();
      isApproved = normalizedStatus === 'APPROVED';

      const normalizedSignal = String(
        parsedResponse.confidenceSignal || '',
      ).toLowerCase();
      confidenceSignal = VALID_CONFIDENCE_SIGNALS.includes(normalizedSignal)
        ? normalizedSignal
        : null;
    } catch (e) {
      this.logger.error('Failed to parse AI JSON response', e);
      aiMessageContent = rawAiResponse;
    }

    // NẾU APPROVED -> CHUYỂN TRẠNG THÁI SANG PHASE 2
    if (isApproved && session.status === SessionStatus.PHASE_1_STRATEGY) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.PHASE_2_IMPLEMENT,
          version: { increment: 1 },
          // Chốt lại đúng câu trả lời/feedback tại thời điểm được duyệt — đây
          // là nguồn dữ liệu duy nhất cho Offer Debrief (career.processor.ts),
          // trước đây 2 field này tồn tại trong schema nhưng chưa từng được ghi.
          strategyAnswer: content,
          strategyFeedback: aiMessageContent,
          confidenceSignal,
        },
      });

      this.chatGateway.server.to(sessionId).emit('session_status_update', {
        status: SessionStatus.PHASE_2_IMPLEMENT,
        notification: 'Chiến lược hợp lý! Editor đã được mở khóa.',
      });

      this.logger.log(`Session ${sessionId} promoted to PHASE 2`);
    }

    // Lưu tin nhắn vào DB
    const savedMessage = await this.prisma.message.create({
      data: {
        sessionId,
        content: aiMessageContent,
        sender: MessageSender.AI,
        metaData: isApproved ? { approved: true } : {},
      },
    });

    // Gửi tin nhắn cho User qua WebSocket
    this.chatGateway.server.to(sessionId).emit('receive_message', savedMessage);
  }

  /**
   * PHASE 3: Code Evaluation (Clean Code + Performance + Best Practices)
   */
  private async processEvaluateCode(data: EvaluateCodeJobData) {
    const { sessionId, submissionId, code, language } = data;

    try {
      // 1. Lấy Session + Problem
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { problem: true },
      });

      if (!session || !session.problem) {
        this.logger.error(`Session ${sessionId} or problem not found`);
        return;
      }

      // 2. Tạo Problem Context
      const problem = session.problem;
      const problemContext = `
Problem Title: ${problem.title}
Difficulty: ${problem.difficulty}
Time Limit: ${problem.timeLimitMs}ms
Memory Limit: ${problem.memoryLimitMb}MB

Description:
${problem.content}

Function Name: ${problem.functionName}
Test Cases: ${JSON.stringify([
        ...((problem.sampleTestCases as unknown[]) ?? []),
        ...((problem.hiddenTestCases as unknown[]) ?? []),
      ])}
      `;

      // 3. Gọi AI để evaluate code
      this.logger.log(`[Phase 3] Evaluating code for session: ${sessionId}`);
      const evaluation = await this.aiService.evaluateCode(
        code,
        language,
        problemContext,
      );

      // 4. Lưu Evaluation vào DB
      const savedEvaluation = await this.prisma.evaluation.upsert({
        where: { sessionId },
        update: {
          scores: evaluation.scores,
          feedback: evaluation.feedback,
          pros: evaluation.pros,
          cons: evaluation.cons,
        },
        create: {
          sessionId,
          scores: evaluation.scores,
          feedback: evaluation.feedback,
          pros: evaluation.pros,
          cons: evaluation.cons,
        },
      });

      this.logger.log(
        `[Phase 3] Evaluation saved for session: ${sessionId}. Scores: ${JSON.stringify(evaluation.scores)}`,
      );

      // 5. (Optional) Emit event qua WebSocket để Frontend biết evaluation xong
      this.chatGateway.server.to(sessionId).emit('code_evaluation_complete', {
        sessionId,
        submissionId,
        evaluation: savedEvaluation,
      });

      // 6. Auto-grade career journey (P4) — career.listener.ts tự bỏ qua nếu
      // session này không thuộc stage PROBLEM đang ACTIVE của journey nào.
      this.eventEmitter.emit('evaluation.completed', {
        sessionId,
        scores: evaluation.scores,
      });

      return savedEvaluation;
    } catch (error) {
      this.logger.error(
        `[Phase 3] Error evaluating code for session ${sessionId}:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error; // Let BullMQ retry
    }
  }

  /**
   * P3: Chấm điểm 2 chiều 1 LẦN duy nhất sau khi buổi peer interview kết
   * thúc (enqueue từ ChatGateway#handleEndPeerInterview). Tái dùng đúng
   * AiProcessor/chatGateway đã có — không tạo processor/forwardRef mới.
   */
  private async processGradePeerInterview(data: GradePeerInterviewJobData) {
    const { peerSessionId } = data;

    try {
      const session = await this.prisma.peerInterviewSession.findUnique({
        where: { id: peerSessionId },
        include: {
          problem: true,
          messages: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!session || !session.problem) {
        this.logger.error(
          `Peer interview session ${peerSessionId} or problem not found`,
        );
        return;
      }

      const problem = session.problem;
      const problemContext = `
Problem Title: ${problem.title}
Difficulty: ${problem.difficulty}

Description:
${problem.content}
      `;

      this.logger.log(`[P3] Grading peer interview: ${peerSessionId}`);
      const grading = await this.aiService.gradePeerInterview(
        session.messages.map((m) => ({ role: m.role, content: m.content })),
        problemContext,
      );

      const savedEvaluation = await this.prisma.peerInterviewEvaluation.upsert({
        where: { sessionId: peerSessionId },
        update: {
          candidateScore: grading.candidateScore,
          candidateFeedback: grading.candidateFeedback,
          peerInterviewerScore: grading.peerInterviewerScore,
          peerInterviewerFeedback: grading.peerInterviewerFeedback,
        },
        create: {
          sessionId: peerSessionId,
          candidateScore: grading.candidateScore,
          candidateFeedback: grading.candidateFeedback,
          peerInterviewerScore: grading.peerInterviewerScore,
          peerInterviewerFeedback: grading.peerInterviewerFeedback,
        },
      });

      this.logger.log(
        `[P3] Evaluation saved for peer session: ${peerSessionId}`,
      );

      this.chatGateway.server
        .to(`peer:${peerSessionId}`)
        .emit('peer_interview_graded', {
          peerSessionId,
          evaluation: savedEvaluation,
        });

      return savedEvaluation;
    } catch (error) {
      this.logger.error(
        `[P3] Error grading peer interview ${peerSessionId}:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error; // Let BullMQ retry
    }
  }
}

// Job Flow:
// ============
// PHASE 1-2: Chat Strategy
// User gửi chat → ChatGateway emit message → ChatService → Bull queue (chat-job)
// → AiProcessor.processChat() → AI evaluate strategy → Update session status
// → Emit WebSocket event
//
// PHASE 3: Code Evaluation
// JudgeService submission ACCEPTED → Emit submission.accepted event
// → AiListener catch event → Bull queue (evaluate-code)
// → AiProcessor.processEvaluateCode() → AI evaluate code → Save Evaluation
// → (Future) Emit WebSocket event
