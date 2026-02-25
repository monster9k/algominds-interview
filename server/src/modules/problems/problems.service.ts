import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import slugify from 'slugify';

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
  async findAll(userId?: string) {
    const problems = await this.prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        acceptanceRate: true,
        solution: true,
        tags: { select: { tag: true } }, // Chỉ lấy tên tag để hiển thị list
        sessions: {
          where: userId ? { userId } : undefined,
          select: {
            submissions: {
              select: { status: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return problems.map((p) => {
      let status: string | null = null;

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
  }
  // LẤY CHI TIẾT 1 BÀI (Theo Slug)
  async findOne(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: {
        tags: { include: { tag: true } },
      },
    });
    return problem;
  }
}
