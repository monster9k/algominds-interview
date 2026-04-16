import { Processor, WorkerHost } from '@nestjs/bullmq';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
import { ChatGateway } from '../chat/chat/chat.gateway';
import { MessageSender, SessionStatus } from '@prisma/client';

@Processor('ai-queue')
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const jobName = job.name;
    const data = job.data as {
      submissionId?: string;
      sessionId: string;
      userId: string;
      content?: string;
      code?: string;
      language?: string;
    };

    this.logger.log(`Processing ${jobName} for session: ${data.sessionId}`);

    if (jobName === 'chat-job') {
      return this.processChat(data as any);
    } else if (jobName === 'evaluate-code') {
      return this.processEvaluateCode(data as any);
    } else {
      this.logger.warn(`Unknown job type: ${jobName}`);
    }
  }

  /**
   * PHASE 1-2: Chat Strategy Evaluation & Phase Transition
   */
  private async processChat(data: {
    sessionId: string;
    userId: string;
    content: string;
  }) {
    const { sessionId, content } = data;

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        problem: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
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

    // Gọi AI Service
    const rawAiResponse = await this.aiService.generateResponse(
      history,
      content,
      problemContext,
    );

    // PARSE JSON & XỬ LÝ LOGIC
    let aiMessageContent = '';
    let isApproved = false;

    try {
      const parsedResponse = JSON.parse(rawAiResponse);
      aiMessageContent = parsedResponse.message;
      isApproved = parsedResponse.status === 'APPROVED';
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
  private async processEvaluateCode(data: {
    submissionId?: string;
    sessionId: string;
    userId: string;
    code: string;
    language: string;
  }) {
    const { sessionId, submissionId, userId, code, language } = data;

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
Test Cases: ${JSON.stringify(problem.testCases)}
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

      return savedEvaluation;
    } catch (error) {
      this.logger.error(
        `[Phase 3] Error evaluating code for session ${sessionId}:`,
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
