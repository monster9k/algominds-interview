import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { deriveContestStatus } from '../contest/contest.service';

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
}

function parsePagination(query: PaginationQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

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

  async getUsers(query: PaginationQuery) {
    const { page, limit, skip } = parsePagination(query);

    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const sortable = ['name', 'email', 'role', 'createdAt'];
    const sortBy = sortable.includes(query.sortBy ?? '')
      ? query.sortBy!
      : 'createdAt';
    const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isPro: true,
          createdAt: true,
          deletedAt: true,
        },
        orderBy: { [sortBy]: sortDirection },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getProblems(query: PaginationQuery) {
    const { page, limit, skip } = parsePagination(query);

    const where: Prisma.ProblemWhereInput = query.search
      ? { title: { contains: query.search, mode: 'insensitive' } }
      : {};

    const sortable = ['title', 'difficulty', 'createdAt', 'displayId'];
    const sortBy = sortable.includes(query.sortBy ?? '')
      ? query.sortBy!
      : 'displayId';
    const sortDirection = query.sortDirection === 'desc' ? 'desc' : 'asc';

    // KHÔNG filter deletedAt: null (khác GET /problems công khai) — admin
    // cần thấy cả problem đã xoá để cột Trạng thái hiển thị đúng thực tế.
    const [data, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        select: {
          id: true,
          displayId: true,
          title: true,
          difficulty: true,
          deletedAt: true,
          createdAt: true,
        },
        orderBy: { [sortBy]: sortDirection },
        skip,
        take: limit,
      }),
      this.prisma.problem.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // GET /admin/problems/:id — chi tiết đầy đủ để prefill form Edit, KHÁC
  // problems.service.ts#findOne() (public, theo slug, cố tình bỏ
  // hiddenTestCases) — admin cần thấy hết để sửa đúng.
  async getProblemById(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    if (!problem) {
      throw new NotFoundException('Không tìm thấy bài tập');
    }
    return problem;
  }

  // Chặn admin tự đổi role/xoá chính mình — tránh tự khoá mình ra khỏi
  // Admin Dashboard (không có cách nào tự nâng quyền lại nếu lỡ tay).
  async updateUserRole(
    currentUserId: string,
    targetId: string,
    role: UserRole,
  ) {
    if (targetId === currentUserId) {
      throw new BadRequestException('Không thể tự đổi role của chính mình');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy user');
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  async softDeleteUser(currentUserId: string, targetId: string) {
    if (targetId === currentUserId) {
      throw new BadRequestException('Không thể tự xoá chính mình');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy user');
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { deletedAt: new Date() },
      select: { id: true, email: true, name: true },
    });
  }

  async getContests(query: PaginationQuery) {
    const { page, limit, skip } = parsePagination(query);

    const where: Prisma.ContestWhereInput = query.search
      ? { title: { contains: query.search, mode: 'insensitive' } }
      : {};

    const sortable = ['title', 'startTime', 'createdAt'];
    const sortBy = sortable.includes(query.sortBy ?? '')
      ? query.sortBy!
      : 'startTime';
    const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc';

    const [rows, total] = await Promise.all([
      this.prisma.contest.findMany({
        where,
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          deletedAt: true,
        },
        orderBy: { [sortBy]: sortDirection },
        skip,
        take: limit,
      }),
      this.prisma.contest.count({ where }),
    ]);

    const data = rows.map((c) => ({
      ...c,
      status: deriveContestStatus(c.startTime, c.endTime),
    }));

    return { data, total, page, limit };
  }

  // GET /admin/audit-log — ADMIN only (không cho MODERATOR xem, nhạy cảm).
  async getAuditLog(query: PaginationQuery) {
    const { page, limit, skip } = parsePagination(query);

    const [data, total] = await Promise.all([
      this.prisma.adminActionLog.findMany({
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          metadata: true,
          createdAt: true,
          admin: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminActionLog.count(),
    ]);

    return { data, total, page, limit };
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
