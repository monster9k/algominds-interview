import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';

export interface FindPostsFilters {
  problemId?: string;
  tag?: string;
  sort?: string;
  search?: string;
}

const POST_LIST_SELECT = {
  id: true,
  title: true,
  content: true,
  problemId: true,
  viewCount: true,
  upvoteCount: true,
  commentCount: true,
  createdAt: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
  tags: { select: { tag: true } },
} satisfies Prisma.DiscussPostSelect;

const AUTHOR_SELECT = {
  select: { id: true, name: true, avatarUrl: true },
} satisfies { select: Prisma.UserSelect };

@Injectable()
export class DiscussService {
  constructor(private prisma: PrismaService) {}

  // GET /discuss — list bài viết, lọc theo problemId (tab Discuss của 1 bài
  // toán cụ thể) hoặc/và tag, sort theo newest/mostViewed/mostUpvoted.
  async findPosts(filters: FindPostsFilters, userId?: string) {
    const search = filters.search?.trim();
    const where: Prisma.DiscussPostWhereInput = {
      deletedAt: null,
      ...(filters.problemId && { problemId: filters.problemId }),
      ...(filters.tag && { tags: { some: { tag: { slug: filters.tag } } } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const posts = await this.prisma.discussPost.findMany({
      where,
      select: POST_LIST_SELECT,
      orderBy: this.parseSort(filters.sort),
    });

    return this.attachUpvoted(posts, userId);
  }

  // GET /discuss/:id — chi tiết bài + comment, tăng viewCount mỗi lần gọi
  // (chấp nhận có thể bị inflate do reload nhiều lần — dedupe theo
  // session/IP để P2, xem ROADMAP.md).
  async findPostById(id: string, userId?: string) {
    const existing = await this.prisma.discussPost.findUnique({
      where: { id },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const post = await this.prisma.discussPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: {
        ...POST_LIST_SELECT,
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: AUTHOR_SELECT,
          },
        },
      },
    });

    const upvoted = userId
      ? Boolean(
          await this.prisma.discussPostVote.findUnique({
            where: { userId_postId: { userId, postId: id } },
          }),
        )
      : false;

    return { ...post, upvoted };
  }

  // POST /discuss — tạo bài, tagNames dùng connectOrCreate như
  // problems.service.ts#create (tag đã có -> connect, chưa có -> tạo mới).
  async createPost(userId: string, dto: CreatePostDto) {
    if (dto.problemId) {
      const problem = await this.prisma.problem.findUnique({
        where: { id: dto.problemId, deletedAt: null },
      });
      if (!problem) throw new NotFoundException('Bài toán không tồn tại');
    }

    const tagConnectOrCreate = dto.tagNames?.map((name) => ({
      tag: {
        connectOrCreate: {
          where: { name },
          create: { name, slug: slugify(name, { lower: true, strict: true }) },
        },
      },
    }));

    return this.prisma.discussPost.create({
      data: {
        authorId: userId,
        problemId: dto.problemId,
        title: dto.title,
        content: dto.content,
        ...(tagConnectOrCreate && { tags: { create: tagConnectOrCreate } }),
      },
      select: POST_LIST_SELECT,
    });
  }

  // DELETE /discuss/:id (moderation — ADMIN/MODERATOR) — soft delete.
  async deletePost(id: string) {
    const post = await this.prisma.discussPost.findUnique({ where: { id } });
    if (!post || post.deletedAt) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    return this.prisma.discussPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // POST /discuss/:id/comments
  async createComment(postId: string, userId: string, dto: CreateCommentDto) {
    const post = await this.prisma.discussPost.findUnique({
      where: { id: postId },
    });
    if (!post || post.deletedAt) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.discussComment.create({
        data: { postId, authorId: userId, content: dto.content },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: AUTHOR_SELECT,
        },
      }),
      this.prisma.discussPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    return comment;
  }

  // DELETE /discuss/:postId/comments/:commentId (moderation — ADMIN/MODERATOR)
  // — "ban" 1 comment cụ thể, khác deletePost() ở chỗ chỉ ẩn 1 comment chứ
  // không xoá cả bài. Soft delete + giảm DiscussPost.commentCount trong 1
  // transaction, đối xứng với tăng đếm ở createComment() phía trên.
  async banComment(postId: string, commentId: string) {
    const comment = await this.prisma.discussComment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.postId !== postId || comment.deletedAt) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const [bannedComment] = await this.prisma.$transaction([
      this.prisma.discussComment.update({
        where: { id: commentId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.discussPost.update({
        where: { id: postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);

    return bannedComment;
  }

  // GET /admin/discuss/:postId/comments — trả CẢ comment đã bị ban (khác
  // findPostById() ở trên chỉ trả comment còn sống cho phía user), để admin
  // phân biệt được trạng thái từng comment khi kiểm duyệt.
  getPostComments(postId: string) {
    return this.prisma.discussComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        deletedAt: true,
        author: AUTHOR_SELECT,
      },
    });
  }

  // POST /discuss/:id/vote — toggle: chưa vote -> tạo row + tăng đếm, đã
  // vote -> xoá row + giảm đếm.
  async toggleVote(postId: string, userId: string) {
    const post = await this.prisma.discussPost.findUnique({
      where: { id: postId },
    });
    if (!post || post.deletedAt) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const existing = await this.prisma.discussPostVote.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.discussPostVote.delete({ where: { id: existing.id } }),
        this.prisma.discussPost.update({
          where: { id: postId },
          data: { upvoteCount: { decrement: 1 } },
        }),
      ]);
      return { upvoted: false };
    }

    await this.prisma.$transaction([
      this.prisma.discussPostVote.create({ data: { userId, postId } }),
      this.prisma.discussPost.update({
        where: { id: postId },
        data: { upvoteCount: { increment: 1 } },
      }),
    ]);
    return { upvoted: true };
  }

  // GET /discuss/tags/trending — top tag theo số bài viết, dùng cho widget
  // "Chủ đề Nổi Bật".
  async getTrendingTags(limit = 8) {
    const grouped = await this.prisma.discussPostTag.groupBy({
      by: ['tagId'],
      _count: { tagId: true },
      orderBy: { _count: { tagId: 'desc' } },
      take: limit,
    });
    if (grouped.length === 0) return [];

    const tags = await this.prisma.tag.findMany({
      where: { id: { in: grouped.map((g) => g.tagId) } },
    });
    const countByTagId = new Map(grouped.map((g) => [g.tagId, g._count.tagId]));

    return tags
      .map((tag) => ({ ...tag, postCount: countByTagId.get(tag.id) ?? 0 }))
      .sort((a, b) => b.postCount - a.postCount);
  }

  // GET /discuss/contributors/top — top user theo tổng upvote nhận được
  // trên các bài đã đăng, dùng cho widget "Đóng Góp Nổi Bật". Cùng pattern
  // groupBy + enrich N+1 với quest.service.ts#getLeaderboard.
  async getTopContributors(limit = 5) {
    const grouped = await this.prisma.discussPost.groupBy({
      by: ['authorId'],
      where: { deletedAt: null },
      _sum: { upvoteCount: true },
      orderBy: { _sum: { upvoteCount: 'desc' } },
      take: limit,
    });
    if (grouped.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.authorId) } },
      select: { id: true, name: true, avatarUrl: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return grouped
      .map((g) => ({
        user: userById.get(g.authorId) ?? null,
        totalUpvotes: g._sum.upvoteCount ?? 0,
      }))
      .filter(
        (
          row,
        ): row is {
          user: NonNullable<typeof row.user>;
          totalUpvotes: number;
        } => row.user !== null,
      )
      .sort((a, b) => b.totalUpvotes - a.totalUpvotes);
  }

  private async attachUpvoted<T extends { id: string }>(
    posts: T[],
    userId?: string,
  ): Promise<(T & { upvoted: boolean })[]> {
    if (!userId || posts.length === 0) {
      return posts.map((p) => ({ ...p, upvoted: false }));
    }

    const votes = await this.prisma.discussPostVote.findMany({
      where: { userId, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });
    const votedPostIds = new Set(votes.map((v) => v.postId));

    return posts.map((p) => ({ ...p, upvoted: votedPostIds.has(p.id) }));
  }

  // Chuẩn hoá query param "sort" ('newest'/'mostViewed'/'mostUpvoted'),
  // mặc định newest — cùng convention parseXxx() private helper với
  // problems.service.ts.
  private parseSort(
    value?: string,
  ): Prisma.DiscussPostOrderByWithRelationInput {
    switch (value) {
      case 'mostViewed':
        return { viewCount: 'desc' };
      case 'mostUpvoted':
        return { upvoteCount: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }
}
