import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PeerSessionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const SESSION_WITH_RELATIONS_INCLUDE = {
  candidate: { select: { id: true, name: true, avatarUrl: true } },
  peerInterviewer: { select: { id: true, name: true, avatarUrl: true } },
  problem: { select: { id: true, title: true, slug: true, difficulty: true } },
  messages: { orderBy: { createdAt: 'asc' as const } },
  evaluation: true,
};

@Injectable()
export class PeerInterviewService {
  constructor(private prisma: PrismaService) {}

  // 4 byte -> 8 ký tự hex, đủ ngắn để share thủ công (đọc qua voice call) mà
  // vẫn đủ entropy để không đoán trúng. Retry nếu trùng (@unique) — cực hiếm.
  private generateInviteCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  async create(candidateId: string, problemId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true },
    });
    if (!problem) throw new NotFoundException('Bài toán không tồn tại');

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.prisma.peerInterviewSession.create({
          data: {
            candidateId,
            problemId,
            inviteCode: this.generateInviteCode(),
          },
          include: SESSION_WITH_RELATIONS_INCLUDE,
        });
      } catch (err) {
        const isUniqueClash =
          err instanceof Object &&
          'code' in err &&
          (err as { code?: string }).code === 'P2002';
        if (!isUniqueClash) throw err;
      }
    }
    throw new BadRequestException('Không tạo được mã mời, vui lòng thử lại.');
  }

  async join(userId: string, inviteCode: string) {
    const session = await this.prisma.peerInterviewSession.findUnique({
      where: { inviteCode },
    });
    if (!session) throw new NotFoundException('Mã mời không hợp lệ');

    if (session.candidateId === userId) {
      throw new BadRequestException(
        'Bạn không thể tự join phiên peer interview của chính mình',
      );
    }
    if (session.status !== PeerSessionStatus.WAITING_FOR_PEER) {
      throw new BadRequestException(
        'Phiên này đã có người thứ 2 hoặc đã kết thúc',
      );
    }

    return this.prisma.peerInterviewSession.update({
      where: { id: session.id },
      data: { peerInterviewerId: userId, status: PeerSessionStatus.ACTIVE },
      include: SESSION_WITH_RELATIONS_INCLUDE,
    });
  }

  async findById(userId: string, id: string) {
    const session = await this.prisma.peerInterviewSession.findUnique({
      where: { id },
      include: SESSION_WITH_RELATIONS_INCLUDE,
    });
    if (!session) throw new NotFoundException('Phiên không tồn tại');

    if (
      session.candidateId !== userId &&
      session.peerInterviewerId !== userId
    ) {
      throw new ForbiddenException('Bạn không có quyền truy cập phiên này');
    }

    return session;
  }

  // Admin force-abandon 1 phiên bị kẹt (vd 1 bên rớt mạng, không bao giờ
  // join/thoát) — chỉ cho chuyển sang ABANDONED, không cho set các status
  // khác vì WAITING_FOR_PEER/ACTIVE/COMPLETED do luồng join/chấm điểm tự
  // quản lý (xem career.service.ts#handlePeerInterviewGraded()).
  async forceAbandon(id: string) {
    const session = await this.prisma.peerInterviewSession.findUnique({
      where: { id },
    });
    if (!session) throw new NotFoundException('Phiên không tồn tại');
    if (session.status === PeerSessionStatus.ABANDONED) {
      throw new BadRequestException('Phiên này đã ở trạng thái ABANDONED');
    }
    if (session.status === PeerSessionStatus.COMPLETED) {
      throw new BadRequestException('Không thể abandon 1 phiên đã hoàn thành');
    }

    return this.prisma.peerInterviewSession.update({
      where: { id },
      data: { status: PeerSessionStatus.ABANDONED },
      include: SESSION_WITH_RELATIONS_INCLUDE,
    });
  }
}
