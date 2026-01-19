import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../../prisma/prisma.service';
import { MessageSender } from '@prisma/client';
@WebSocketGateway({
  cors: {
    origin: '*', // Cho phép React (port 5173) kết nối
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway'); //1 logger instance với context = ChatGateway
  //[Nest] 12345  - 01/18/2026, 10:22:31 AM  LOG [ChatGateway] Client connected: abc123

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room') // tương tự post/get
  handleJoinRoom(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Cho client tham gia vào "phòng" có tên là sessionId
    if (!data.sessionId) {
      this.logger.error('sessionId is undefined');
      return;
    }
    client.join(data.sessionId);

    this.logger.log(`Client ${client.id} joined room ${data.sessionId}`);

    // (Optional) Báo cho mọi người trong phòng biết có người mới vào
    // client.to(data.sessionId).emit('user_joined', `User ${client.id} joined`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: {
      sessionId: string;
      content: string;
      sender: MessageSender;
    },
  ) {
    // A. Lưu vào Database trước
    const newMessage = await this.prisma.message.create({
      data: {
        sessionId: data.sessionId,
        content: data.content,
        sender: data.sender, // 'USER' hoặc 'AI'
      },
    });

    // B. Gửi tin nhắn vừa lưu cho TẤT CẢ mọi người trong phòng (kể cả người gửi)
    // Sự kiện bắn về tên là 'receive_message'
    this.server.to(data.sessionId).emit('receive_message', newMessage);

    return newMessage;
  }
}
