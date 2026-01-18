import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionStatus } from '@prisma/client';
@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createSessionDto: CreateSessionDto) {
    const { problemId } = createSessionDto;

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      throw new NotFoundException('Bài tập không tồn tại');
    }

    await this.prisma.session.create({
      data: {
        userId,
        problemId,
        status: SessionStatus.PHASE_1_STRATEGY, // Bắt buộc phải tư duy trước
        version: 1, // Khởi tạo version 1
      },
      include: {
        problem: {
          // Lấy luôn thông tin bài tập để hiển thị tên, độ khó
          select: { title: true, slug: true, difficulty: true },
        },
      },
    });
  }

  // LẤY CHI TIẾT SESSION (Để user vào lại phòng thi)
  async findOne(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        problem: true, // Lấy full đề bài
        user: { select: { id: true, name: true, avatarUrl: true } }, // Lấy info user
      },
    });

    if (!session) throw new NotFoundException('Phiên làm việc không tồn tại');

    // Bảo mật: Không cho xem session của người khác
    if (session.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền truy cập phiên này');
    }

    return session;
  }
}
