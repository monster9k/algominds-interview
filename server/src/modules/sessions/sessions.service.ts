import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionStatus } from '@prisma/client';
import { UpdateSessionDto } from './dto/update-session.dto';
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

  async update(id: string, userId: string, updateSessionDto: UpdateSessionDto) {
    const { version, ...dataToUpdate } = updateSessionDto;

    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Phiên làm việc không tồn tại');
    }

    if (session.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền sửa phiên này');
    }

    // Logic Optimistic Locking (Xử lý `version` để tránh ghi đè).
    if (session.version !== version) {
      throw new ConflictException(
        'Dữ liệu đã bị thay đổi bởi thiết bị khác. Vui lòng tải lại trang.',
      );
    }

    return this.prisma.session.update({
      where: { id }, // Chỉ cần where ID vì ta đã check logic ở trên rồi
      data: {
        ...dataToUpdate,
        version: { increment: 1 }, // Tự động +1 version
      },
    });
  }
}
