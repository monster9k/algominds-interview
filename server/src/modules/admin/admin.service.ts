import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalUsers, totalProblems, totalSubmissions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.problem.count(),
      this.prisma.submission.count(),
    ]);

    return { totalUsers, totalProblems, totalSubmissions };
  }

  getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isPro: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Khác GET /quest/snippets — endpoint đó cố tình strip buggyLine/explanation
  // để chống lộ đáp án qua Network tab lúc chơi (xem quest.controller.ts).
  // Admin cần thấy đủ đáp án nên không tái dùng được endpoint đó.
  getQuests() {
    return this.prisma.bugSnippet.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // peer-interview.controller.ts hiện chỉ có GET :id (1 session) — đây là
  // endpoint list đầu tiên cho domain này.
  getPeerInterviews() {
    return this.prisma.peerInterviewSession.findMany({
      select: {
        id: true,
        status: true,
        startedAt: true,
        endedAt: true,
        candidate: { select: { id: true, name: true, email: true } },
        peerInterviewer: { select: { id: true, name: true, email: true } },
        problem: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}
