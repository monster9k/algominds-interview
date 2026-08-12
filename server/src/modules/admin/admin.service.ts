import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Difficulty, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { deriveContestStatus } from '../contest/contest.service';

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
  difficulty?: string;
}

function parsePagination(query: PaginationQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

const SESSIONS_TIMESERIES_RANGE_DAYS: Record<string, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  ALL: 365,
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // %-delta so 7 ngày trước — dùng chung cho mọi KPI ở getStats().
  private pctDelta(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  async getStats() {
    const currentStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const previousStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalSessions,
      completedSessions,
      usersCurrent,
      usersPrevious,
      submissionsCurrent,
      submissionsPrevious,
      sessionsCurrent,
      sessionsPrevious,
      completedCurrent,
      completedPrevious,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.problem.count(),
      this.prisma.submission.count(),
      this.prisma.session.count(),
      this.prisma.session.count({ where: { status: 'COMPLETED' } }),
      this.prisma.user.count({ where: { createdAt: { gte: currentStart } } }),
      this.prisma.user.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } },
      }),
      this.prisma.submission.count({
        where: { createdAt: { gte: currentStart } },
      }),
      this.prisma.submission.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } },
      }),
      this.prisma.session.count({
        where: { startedAt: { gte: currentStart } },
      }),
      this.prisma.session.count({
        where: { startedAt: { gte: previousStart, lt: currentStart } },
      }),
      this.prisma.session.count({
        where: { status: 'COMPLETED', startedAt: { gte: currentStart } },
      }),
      this.prisma.session.count({
        where: {
          status: 'COMPLETED',
          startedAt: { gte: previousStart, lt: currentStart },
        },
      }),
    ]);

    const completionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const completionRateCurrent =
      sessionsCurrent > 0 ? (completedCurrent / sessionsCurrent) * 100 : 0;
    const completionRatePrevious =
      sessionsPrevious > 0 ? (completedPrevious / sessionsPrevious) * 100 : 0;

    return {
      totalUsers,
      totalUsersDeltaPct: this.pctDelta(usersCurrent, usersPrevious),
      totalProblems,
      totalSessions,
      totalSessionsDeltaPct: this.pctDelta(sessionsCurrent, sessionsPrevious),
      totalSubmissions,
      totalSubmissionsDeltaPct: this.pctDelta(
        submissionsCurrent,
        submissionsPrevious,
      ),
      completionRate: Math.round(completionRate * 10) / 10,
      completionRateDeltaPct: this.pctDelta(
        completionRateCurrent,
        completionRatePrevious,
      ),
    };
  }

  // GET /admin/stats/sessions-timeseries?range=1W|1M|3M|ALL — bucket theo
  // Session.startedAt (SessionEvent chưa từng được ghi ở đâu trong codebase,
  // không dùng được cho time-series). Gom trong JS thay vì raw SQL vì data
  // volume nhỏ (dashboard admin, không phải analytics quy mô lớn).
  async getSessionsTimeseries(range: string) {
    const days = SESSIONS_TIMESERIES_RANGE_DAYS[range] ?? 30;
    const bucketByWeek = days > 31;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const sessions = await this.prisma.session.findMany({
      where: { startedAt: { gte: since } },
      select: { startedAt: true },
    });

    const buckets = new Map<string, number>();
    for (const s of sessions) {
      const key = bucketByWeek
        ? this.weekBucketKey(s.startedAt)
        : this.dayBucketKey(s.startedAt);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, count]) => ({ date, count }));
  }

  private dayBucketKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private weekBucketKey(date: Date): string {
    const d = new Date(date);
    const isoDay = d.getUTCDay() || 7; // Monday = 1 ... Sunday = 7
    d.setUTCDate(d.getUTCDate() - isoDay + 1);
    return d.toISOString().slice(0, 10);
  }

  async getSessionStatusBreakdown() {
    const rows = await this.prisma.session.groupBy({
      by: ['status'],
      _count: true,
    });
    return rows.map((r) => ({ status: r.status, count: r._count }));
  }

  // Problem.acceptanceRate/submitCount/passCount là field denormalize sẵn
  // nhưng chưa từng được ghi ở bất kỳ đâu trong codebase (luôn = 0 mặc định)
  // — không dùng được. Tính trực tiếp từ Submission + Session.problem thay
  // thế, cùng data volume nhỏ nên gom trong JS như getSessionsTimeseries().
  async getAcceptanceByDifficulty() {
    const submissions = await this.prisma.submission.findMany({
      select: {
        status: true,
        session: { select: { problem: { select: { difficulty: true } } } },
      },
    });

    const buckets: Record<Difficulty, { total: number; accepted: number }> = {
      EASY: { total: 0, accepted: 0 },
      MEDIUM: { total: 0, accepted: 0 },
      HARD: { total: 0, accepted: 0 },
    };

    for (const s of submissions) {
      const bucket = buckets[s.session.problem.difficulty];
      bucket.total += 1;
      if (s.status === 'ACCEPTED') bucket.accepted += 1;
    }

    return (Object.keys(buckets) as Difficulty[]).map((difficulty) => {
      const { total, accepted } = buckets[difficulty];
      return {
        difficulty,
        acceptanceRate:
          total > 0 ? Math.round((accepted / total) * 1000) / 10 : 0,
      };
    });
  }

  // Mirror query của companies.service.ts#findAll() (group theo số problem
  // liên kết), giới hạn top N cho widget dashboard — không có khái niệm
  // "sessions per company" trong schema (Company chỉ liên kết Problem).
  async getTopCompanies(limit = 5) {
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { problems: true } },
      },
      orderBy: { problems: { _count: 'desc' } },
      take: limit,
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c._count.problems,
    }));
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

    // difficulty=EASY,MEDIUM — dùng cho popover filter ở /admin/problems.
    const validDifficulties = Object.values(Difficulty) as string[];
    const difficulties = (query.difficulty ?? '')
      .split(',')
      .map((d) => d.trim().toUpperCase())
      .filter((d) => validDifficulties.includes(d)) as Difficulty[];
    if (difficulties.length > 0) {
      where.difficulty = { in: difficulties };
    }

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
          description: true,
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
