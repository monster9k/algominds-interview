import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../../prisma/prisma.service';
import { MessageSender } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

type AuthenticatedSocketUser = {
  userId: string;
  username: string;
  role: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

// socket.io's SocketData generic defaults to `any` — pin it down so
// `client.data.user` type-checks instead of being an unsafe `any` access.
type AppSocket = Socket<any, any, any, { user?: AuthenticatedSocketUser }>;

// Không set `origin: FRONTEND_URL` trực tiếp ở decorator: decorator này chạy
// khi Node require() class (trước khi ConfigModule.forRoot() nạp .env), nên
// process.env lúc đó chưa có gì. Whitelist thật sự được set trong afterInit()
// bên dưới, sau khi DI container (và ConfigService) đã sẵn sàng.
@WebSocketGateway({
  cors: {
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server!: Server;

  private static readonly MAX_MESSAGE_LENGTH = 4000;
  private static readonly MESSAGE_COOLDOWN_MS = 2000;
  // In-memory per-user cooldown — 1 instance của server, không cần Redis cho việc này.
  private readonly lastMessageAt = new Map<string, number>();

  private logger: Logger = new Logger('ChatGateway'); //1 logger instance với context = ChatGateway
  //[Nest] 12345  - 01/18/2026, 10:22:31 AM  LOG [ChatGateway] Client connected: abc123

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectQueue('ai-queue') private aiQueue: Queue, // Inject Queue vào
  ) {}

  afterInit(server: Server) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    server.engine.opts.cors = {
      origin: frontendUrl,
      credentials: true,
    };
  }

  handleConnection(client: AppSocket) {
    const rawToken = client.handshake.auth?.token as string | undefined;

    if (!rawToken) {
      this.logger.warn(`Socket rejected (missing token): ${client.id}`);
      client.disconnect(true);
      return;
    }

    const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;

    try {
      const payload = verify(
        token,
        this.configService.getOrThrow<string>('JWT_SECRET'),
      ) as JwtPayload;

      client.data.user = {
        userId: payload.sub,
        username: payload.email,
        role: payload.role,
      };
    } catch {
      this.logger.warn(`Socket rejected (invalid token): ${client.id}`);
      client.disconnect(true);
      return;
    }

    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AppSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room') // tương tự post/get
  async handleJoinRoom(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: AppSocket,
  ) {
    const socketUser = client.data.user;

    if (!socketUser?.userId) {
      client.emit('error', { message: 'Unauthorized socket connection' });
      client.disconnect(true);
      return;
    }

    if (!data.sessionId) {
      this.logger.error('sessionId is undefined');
      return;
    }

    const session = await this.prisma.session.findUnique({
      where: { id: data.sessionId },
      select: { userId: true },
    });

    if (!session || session.userId !== socketUser.userId) {
      this.logger.warn(
        `Unauthorized room join attempt. socket=${client.id}, session=${data.sessionId}`,
      );
      client.emit('error', { message: 'Forbidden session access' });
      return;
    }

    await client.join(data.sessionId);

    this.logger.log(`Client ${client.id} joined room ${data.sessionId}`);

    // (Optional) Báo cho mọi người trong phòng biết có người mới vào
    // client.to(data.sessionId).emit('user_joined', `User ${client.id} joined`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: AppSocket,
    @MessageBody()
    data: {
      sessionId: string;
      content: string;
    },
  ) {
    const socketUser = client.data.user;

    if (!socketUser?.userId) {
      client.emit('error', { message: 'Unauthorized socket connection' });
      client.disconnect(true);
      return;
    }

    if (
      typeof data.content !== 'string' ||
      !data.content.trim() ||
      data.content.length > ChatGateway.MAX_MESSAGE_LENGTH
    ) {
      client.emit('error', {
        message: `Nội dung tin nhắn không hợp lệ (tối đa ${ChatGateway.MAX_MESSAGE_LENGTH} ký tự).`,
      });
      return;
    }

    // Spam-guard: REST có ThrottlerGuard, WS thì không có gì tương đương —
    // 1 user gửi liên tục sẽ bắn job Gemini liên tục (dù có trừ credit, vẫn
    // đáng chặn sớm để đỡ tải DB/queue).
    const now = Date.now();
    const lastSentAt = this.lastMessageAt.get(socketUser.userId) ?? 0;
    if (now - lastSentAt < ChatGateway.MESSAGE_COOLDOWN_MS) {
      client.emit('error', {
        message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút.',
      });
      return;
    }

    const session = await this.prisma.session.findUnique({
      where: { id: data.sessionId },
      select: { userId: true },
    });

    if (!session || session.userId !== socketUser.userId) {
      this.logger.warn(
        `Unauthorized message attempt. socket=${client.id}, session=${data.sessionId}`,
      );
      client.emit('error', { message: 'Forbidden session access' });
      return;
    }

    this.lastMessageAt.set(socketUser.userId, now);

    // A. Lưu vào Database trước
    const newMessage = await this.prisma.message.create({
      data: {
        sessionId: data.sessionId,
        content: data.content,
        sender: MessageSender.USER,
      },
    });

    // B. Gửi tin nhắn vừa lưu cho TẤT CẢ mọi người trong phòng (kể cả người gửi)
    // Sự kiện bắn về tên là 'receive_message'
    this.server.to(data.sessionId).emit('receive_message', newMessage);

    // C. Khấu trừ AI credit atomic (chỉ trừ nếu còn > 0) trước khi bắn job Gemini,
    // tránh 1 user spam tin nhắn để bắn job vô hạn không giới hạn.
    const creditResult = await this.prisma.userStats.updateMany({
      where: { userId: socketUser.userId, credits: { gt: 0 } },
      data: { credits: { decrement: 1 } },
    });

    if (creditResult.count === 0) {
      client.emit('credits_exhausted', {
        message: 'Bạn đã dùng hết credit AI. Vui lòng nâng cấp để tiếp tục.',
      });
      return newMessage;
    }

    // 3. Người gửi từ socket luôn là USER -> Kích hoạt AI trả lời
    // Đồng bộ retry/backoff với job 'evaluate-code' (ai.listener.ts) — nếu
    // không, 1 lần processChat lỗi sẽ làm mất tin nhắn AI vĩnh viễn và không
    // có gì để debug (job bị xoá khỏi queue ngay cả khi fail).
    await this.aiQueue.add(
      'chat-job',
      {
        sessionId: data.sessionId,
        userId: socketUser.userId,
        content: data.content,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    console.log('Added job to AI Queue');

    return newMessage;
  }
}
