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

  async process(
    job: Job<{ sessionId: string; userId: string; content: string }>,
  ) {
    const { sessionId, content } = job.data;

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
    this.logger.log(`Processing AI job for session: ${sessionId}`);

    // 2. TẠO CONTEXT STRING (Logic Mới)
    // Format thông tin bài tập thành chuỗi văn bản để AI đọc
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
    // 3. Format History phù hợp gemini
    const history = session.messages
      .filter((msg) => msg.content !== content)
      .map((msg) => ({
        role: msg.sender === 'AI' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })) as { role: 'user' | 'model'; parts: { text: string }[] }[];

    // 3. Gọi AI Service (Nhận về chuỗi JSON)
    const rawAiResponse = await this.aiService.generateResponse(
      history,
      content,
      problemContext,
    );

    // 4. PARSE JSON & XỬ LÝ LOGIC
    let aiMessageContent = '';
    let isApproved = false;

    try {
      // Parse chuỗi JSON từ AI
      const parsedResponse = JSON.parse(rawAiResponse);

      aiMessageContent = parsedResponse.message; // Lấy nội dung chat để hiển thị
      isApproved = parsedResponse.status === 'APPROVED'; // Check trạng thái
    } catch (e) {
      this.logger.error('Failed to parse AI JSON response', e);
      aiMessageContent = rawAiResponse; // Fallback nếu AI trả về lỗi
    }

    // 5. NẾU APPROVED -> CHUYỂN TRẠNG THÁI SESSION SANG PHASE 2
    if (isApproved && session.status === SessionStatus.PHASE_1_STRATEGY) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.PHASE_2_IMPLEMENT,
          version: { increment: 1 }, // Optimistic Locking
        },
      });

      // Bắn sự kiện đặc biệt để Frontend biết đường mở khóa Editor
      this.chatGateway.server.to(sessionId).emit('session_status_update', {
        status: SessionStatus.PHASE_2_IMPLEMENT,
        notification: 'Chiến lược hợp lý! Editor đã được mở khóa.',
      });

      this.logger.log(`Session ${sessionId} promoted to PHASE 2`);
    }

    // 5. Lưu tin nhắn vào DB (Chỉ lưu phần text message, không lưu cả cục JSON)
    const savedMessage = await this.prisma.message.create({
      data: {
        sessionId,
        content: aiMessageContent,
        sender: MessageSender.AI,
        // Có thể lưu metadata nếu muốn tracking
        metaData: isApproved ? { approved: true } : {},
      },
    });

    // 6. Gửi tin nhắn phản hồi cho User
    this.chatGateway.server.to(sessionId).emit('receive_message', savedMessage);
  }
}

// User gửi chat
// ↓
// ChatGateway emit message (ngay)
// ↓
// ChatService → Bull queue
// ↓
// AiProcessor xử lý
// ↓
// ChatGateway emit ai_reply
