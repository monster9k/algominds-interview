import { Processor, WorkerHost } from '@nestjs/bullmq';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
import { ChatGateway } from '../chat/chat/chat.gateway';
import { MessageSender } from '@prisma/client';

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

    // 4. Gọi AI Service kèm theo Context
    const aiResponse = await this.aiService.generateResponse(
      history,
      content,
      problemContext, // Truyền context vào
    );

    const savedMessage = await this.prisma.message.create({
      data: {
        sessionId,
        content: aiResponse,
        sender: MessageSender.AI,
      },
    });

    this.chatGateway.server.to(sessionId).emit('receive_message', savedMessage);
    this.logger.log(`Gemini replied to session ${sessionId}`);
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
