import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { MessageSender, Prisma, SessionStatus } from '@prisma/client';
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

  // Interview Replay & Weakness Reel — compose 1 timeline duy nhất từ
  // Message + Evaluation. `SessionEvent` KHÔNG được dùng ở đây: bảng này
  // chưa từng được ghi ở bất kỳ đâu trong codebase hiện tại (không phải chỉ
  // thiếu ở đây — không có sessionEvent.create() nào cả), nên luôn rỗng; vá
  // gap đó là việc riêng, không lẫn vào task này (đã hỏi lại user trước khi
  // quyết định phạm vi). Tương tự, `Message.phaseContext` cũng chưa từng
  // được ghi (dead field) nên không dùng để tách Phase 1/Phase 2 — thay vào
  // đó suy luận lại mốc chuyển phase từ chính message AI approve ĐẦU TIÊN,
  // đúng y hệt điều kiện `isApproved && status === PHASE_1_STRATEGY` trong
  // ai.processor.ts.
  async getReplay(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        problem: {
          select: {
            displayId: true,
            title: true,
            slug: true,
            difficulty: true,
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
        evaluation: true,
      },
    });

    if (!session) throw new NotFoundException('Phiên làm việc không tồn tại');
    if (session.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền truy cập phiên này');
    }

    const firstApprovedIndex = session.messages.findIndex(
      (m) =>
        m.sender === MessageSender.AI &&
        (m.metaData as { approved?: boolean } | null)?.approved === true,
    );

    const messageEntries = session.messages.map((m, index) => {
      const metaData = m.metaData as { approved?: boolean } | null;
      const isBeforeOrAtTransition =
        firstApprovedIndex === -1 || index <= firstApprovedIndex;

      return {
        type: 'MESSAGE' as const,
        createdAt: m.createdAt,
        sender: m.sender,
        messageType: m.type,
        content: m.content,
        // AI chưa approve trong lúc vẫn đang ở Phase 1 -> đây là chỗ AI phát
        // hiện lỗ hổng chiến lược. Message sau mốc approve đầu tiên (Phase 2
        // discussion) không bao giờ bị đánh dấu, kể cả khi AI trả lời
        // "Rejected" cho tin nhắn lạc đề.
        flagged:
          isBeforeOrAtTransition &&
          m.sender === MessageSender.AI &&
          metaData?.approved !== true,
      };
    });

    const timeline: Array<
      | (typeof messageEntries)[number]
      | {
          type: 'EVALUATION';
          createdAt: Date;
          scores: Prisma.JsonValue;
          feedback: string | null;
          pros: Prisma.JsonValue;
          cons: Prisma.JsonValue;
        }
    > = [...messageEntries];

    if (session.evaluation) {
      timeline.push({
        type: 'EVALUATION',
        createdAt: session.evaluation.createdAt,
        scores: session.evaluation.scores,
        feedback: session.evaluation.feedback,
        pros: session.evaluation.pros,
        cons: session.evaluation.cons,
      });
    }

    timeline.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return {
      session: {
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        finishedAt: session.finishedAt,
        problem: session.problem,
      },
      timeline,
    };
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
