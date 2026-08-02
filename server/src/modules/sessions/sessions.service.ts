import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Prisma, SessionStatus } from '@prisma/client';
import { UpdateSessionDto } from './dto/update-session.dto';

// Đề bài trả về cho FE qua session — CHỈ chứa sampleTestCases, không bao giờ
// select testCases (deprecated)/hiddenTestCases để tránh lộ đáp án hidden test.
const SESSION_PROBLEM_SELECT = {
  displayId: true,
  title: true,
  slug: true,
  difficulty: true,
  content: true,
  initialCode: true,
  sampleTestCases: true,
  tags: { include: { tag: true } },
} satisfies Prisma.ProblemSelect;

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createSessionDto: CreateSessionDto) {
    const { problemId } = createSessionDto;

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId, deletedAt: null },
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
          select: {
            displayId: true,
            title: true,
            slug: true,
            difficulty: true,
          },
        },
      },
    });
  }

  async findOrCreateBySlug(userId: string, problemSlug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug: problemSlug, deletedAt: null },
    });
    if (!problem) {
      throw new NotFoundException('Bài tập không tồn tại');
    }

    let session = await this.prisma.session.findFirst({
      where: {
        userId,
        problemId: problem.id,
        status: {
          in: [SessionStatus.PHASE_1_STRATEGY, SessionStatus.PHASE_2_IMPLEMENT],
        }, // Chỉ tìm session đang làm dở
      },
      orderBy: { startedAt: 'desc' }, // Lấy session mới nhất
      include: {
        problem: { select: SESSION_PROBLEM_SELECT },
        messages: { orderBy: { createdAt: 'asc' } }, // Lấy luôn tin nhắn để hiển thị lại cuộc trò chuyện
      },
    });

    if (!session) {
      const initialStatus: SessionStatus = 'PHASE_1_STRATEGY';
      session = await this.prisma.session.create({
        data: {
          userId,
          problemId: problem.id,
          status: initialStatus,
          version: 1,
        },
        include: {
          problem: { select: SESSION_PROBLEM_SELECT },
          messages: true,
        },
      });
    }

    return session;
  }

  // LẤY CHI TIẾT SESSION (Để user vào lại phòng thi)
  async findOne(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        problem: { select: SESSION_PROBLEM_SELECT }, // Đề bài — KHÔNG bao giờ select hiddenTestCases ở đây
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
      select: { userId: true },
    });

    if (!session) {
      throw new NotFoundException('Phiên làm việc không tồn tại');
    }

    if (session.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền sửa phiên này');
    }

    // Optimistic locking phải atomic: đưa `version` vào chính mệnh đề `where`
    // của update thay vì check-rồi-write riêng biệt, nếu không 2 request cùng
    // version gửi gần như đồng thời sẽ đều pass check rồi cùng ghi đè nhau.
    try {
      return await this.prisma.session.update({
        where: { id, version },
        data: {
          ...dataToUpdate,
          version: { increment: 1 }, // Tự động +1 version
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ConflictException(
          'Dữ liệu đã bị thay đổi bởi thiết bị khác. Vui lòng tải lại trang.',
        );
      }
      throw error;
    }
  }
}
