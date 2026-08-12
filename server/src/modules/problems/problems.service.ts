import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Difficulty, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import slugify from 'slugify';

export type ProblemStatus = 'Solved' | 'Attempted' | 'Todo';

export interface FindAllFilters {
  difficulty?: string;
  tags?: string | string[];
  search?: string;
  status?: string;
  sortDirection?: string;
}

@Injectable()
export class ProblemsService {
  constructor(private prisma: PrismaService) {}

  // Tạo bài tập mới
  async create(createProblemDto: CreateProblemDto) {
    const { tags, title, ...problemData } = createProblemDto; // can lay tags va title ra xu ly rieng

    // slug để chuyển title -> url : "Two sum" -> "two-sum"
    const slug = slugify(title, { lower: true, strict: true });

    const exists = await this.prisma.problem.findUnique({
      where: { slug },
    });
    if (exists) {
      throw new ConflictException('Bài tập này đã tồn tại');
    }

    // logic M-N
    // Nếu tag "Array" đã có -> Connect. Nếu chưa -> Create.
    const tagConnectOrCreate = tags?.map((tagName) => ({
      tag: {
        connectOrCreate: {
          where: { name: tagName },
          create: {
            name: tagName,
            slug: slugify(tagName, { lower: true, strict: true }),
          },
        },
      },
    }));

    return this.prisma.problem.create({
      data: {
        ...problemData,
        title,
        slug,
        tags: {
          create: tagConnectOrCreate, // Magic của Prisma nằm ở đây
        },
      },
      include: {
        tags: { include: { tag: true } }, // Trả về luôn thông tin tags
      },
    });
  }

  //LẤY DANH SÁCH (Có phân trang & lọc)
  async findAll(userId?: string, filters?: FindAllFilters) {
    const difficulty = this.parseDifficulty(filters?.difficulty);
    const tags = this.normalizeTags(filters?.tags);
    const search = filters?.search?.trim();
    // Status phụ thuộc vào session/submission của user -> chỉ áp dụng khi đã đăng nhập
    const statusFilter = userId ? this.parseStatus(filters?.status) : undefined;
    const sortDirection = this.parseSortDirection(filters?.sortDirection);

    const where: Prisma.ProblemWhereInput = {
      deletedAt: null,
      ...(difficulty && { difficulty }),
      ...(tags.length > 0 && {
        tags: { some: { tag: { name: { in: tags } } } },
      }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
    };

    const problems = await this.prisma.problem.findMany({
      where,
      select: {
        id: true,
        displayId: true,
        title: true,
        slug: true,
        difficulty: true,
        acceptanceRate: true,
        solution: true,
        tags: { select: { tag: true } }, // Chỉ lấy tên tag để hiển thị list
        sessions: {
          // userId rỗng (guest) sẽ không khớp với bất kỳ session nào (id UUID hợp lệ)
          // -> tránh kéo session của TẤT CẢ user về khi chưa đăng nhập
          where: { userId: userId ?? '' },
          select: {
            submissions: {
              select: { status: true },
            },
          },
        },
      },
      orderBy: { displayId: sortDirection || 'asc' },
    });

    const enriched = problems.map((p) => {
      let status: ProblemStatus | null = null;

      if (userId) {
        status = 'Todo'; // Mặc định là Todo nếu user đã đăng nhập nhưng chưa có session nào với bài tập này
        if (p.sessions && p.sessions.length > 0) {
          const hasAccepted = p.sessions.some((session) =>
            session.submissions.some((sub) => sub.status === 'ACCEPTED'),
          );
          status = hasAccepted ? 'Solved' : 'Attempted';
        }
      }
      // Logic kiểm tra Status: Solved, Attempted, Todo

      return {
        id: p.id,
        displayId: p.displayId,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        tags: p.tags,
        // Ép kiểu cho Frontend
        acceptance: p.acceptanceRate
          ? `${p.acceptanceRate.toFixed(1)}%`
          : 'N/A',
        hasSolution: p.solution !== null,
        status,
      };
    });

    // Status phụ thuộc vào dữ liệu đã enrich (aggregate submissions) nên lọc sau khi map,
    // thay vì lọc trực tiếp ở Prisma `where`.
    if (statusFilter) {
      return enriched.filter((p) => p.status === statusFilter);
    }

    return enriched;
  }
  // Cập nhật bài tập (Admin) — title đổi thì slug cũng đổi theo, giữ đúng
  // convention slug-tự-sinh-từ-title như create().
  async update(id: string, updateProblemDto: UpdateProblemDto) {
    const { tags, title, ...problemData } = updateProblemDto;

    const existing = await this.prisma.problem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài tập');
    }

    const tagUpdate =
      tags !== undefined
        ? {
            tags: {
              deleteMany: {},
              create: tags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: {
                      name: tagName,
                      slug: slugify(tagName, { lower: true, strict: true }),
                    },
                  },
                },
              })),
            },
          }
        : {};

    return this.prisma.problem.update({
      where: { id },
      data: {
        ...problemData,
        ...(title !== undefined && {
          title,
          slug: slugify(title, { lower: true, strict: true }),
        }),
        ...tagUpdate,
      },
      include: { tags: { include: { tag: true } } },
    });
  }

  // Soft delete — mirror pattern deletedAt của User/Contest.
  async softDelete(id: string) {
    const existing = await this.prisma.problem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài tập');
    }

    return this.prisma.problem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // LẤY CHI TIẾT 1 BÀI (Theo Slug)
  async findOne(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        displayId: true,
        slug: true,
        title: true,
        difficulty: true,
        content: true,
        initialCode: true,
        solution: true,
        // KHÔNG select hiddenTestCases/testCases (deprecated) ở đây — đây là
        // endpoint public GET /problems/:slug, lộ hidden testcase = lộ đáp án.
        sampleTestCases: true,
        timeLimitMs: true,
        memoryLimitMb: true,
        submitCount: true,
        passCount: true,
        acceptanceRate: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        functionName: true,
        inputSignature: true,
        tags: { include: { tag: true } },
      },
    });
    return problem;
  }

  // Chuẩn hoá query param "difficulty" (bỏ qua nếu không hợp lệ)
  private parseDifficulty(value?: string): Difficulty | undefined {
    if (!value) return undefined;
    const normalized = value.toUpperCase();
    const isValid = (Object.values(Difficulty) as string[]).includes(
      normalized,
    );
    return isValid ? (normalized as Difficulty) : undefined;
  }

  // Chuẩn hoá query param "tags": có thể là string đơn hoặc mảng string
  private normalizeTags(value?: string | string[]): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  // Chuẩn hoá query param "status" (TODO/SOLVED/ATTEMPTED, không phân biệt hoa thường)
  private parseStatus(value?: string): ProblemStatus | undefined {
    if (!value) return undefined;
    const map: Record<string, ProblemStatus> = {
      TODO: 'Todo',
      SOLVED: 'Solved',
      ATTEMPTED: 'Attempted',
    };
    return map[value.toUpperCase()];
  }

  // Chuẩn hoá query param "sortDirection" ('asc'/'desc', không phân biệt hoa thường)
  private parseSortDirection(value?: string): 'asc' | 'desc' | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    return normalized === 'asc' || normalized === 'desc'
      ? normalized
      : undefined;
  }
}
