// jest's `expect.objectContaining` types as `any`, which trips
// no-unsafe-assignment on every nested matcher object below.

import { NotFoundException } from '@nestjs/common';
import { DiscussService } from './discuss.service';
import { PrismaService } from '../../prisma/prisma.service';

interface PrismaMock {
  discussPost: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    groupBy: jest.Mock;
  };
  discussComment: { create: jest.Mock };
  discussPostVote: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
  discussPostTag: { groupBy: jest.Mock };
  tag: { findMany: jest.Mock };
  user: { findMany: jest.Mock };
  problem: { findUnique: jest.Mock };
  $transaction: jest.Mock;
}

describe('DiscussService', () => {
  let service: DiscussService;
  let prisma: PrismaMock;

  const post = {
    id: 'post-1',
    title: 'Two Sum bang Hash Map',
    content: 'Noi dung bai viet',
    problemId: null,
    viewCount: 0,
    upvoteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    author: { id: 'user-1', name: 'Contest Admin', avatarUrl: null },
    tags: [],
  };

  beforeEach(() => {
    prisma = {
      discussPost: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      discussComment: { create: jest.fn() },
      discussPostVote: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        delete: jest.fn(),
      },
      discussPostTag: { groupBy: jest.fn().mockResolvedValue([]) },
      tag: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      problem: { findUnique: jest.fn() },
      $transaction: jest.fn(
        async (arg: ((tx: PrismaMock) => unknown) | unknown[]) => {
          if (typeof arg === 'function') {
            return arg(prisma);
          }
          return Promise.all(arg);
        },
      ),
    };

    service = new DiscussService(prisma as unknown as PrismaService);
  });

  describe('createPost', () => {
    it('creates a post without tags/problem when neither is given', async () => {
      prisma.discussPost.create.mockResolvedValue(post);

      const result = await service.createPost('user-1', {
        title: post.title,
        content: post.content,
      });

      expect(result).toEqual(post);
      expect(prisma.problem.findUnique).not.toHaveBeenCalled();
      expect(prisma.discussPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            authorId: 'user-1',
            problemId: undefined,
            title: post.title,
            content: post.content,
          },
        }),
      );
    });

    it('throws NotFoundException when problemId does not point to an existing problem', async () => {
      prisma.problem.findUnique.mockResolvedValue(null);

      await expect(
        service.createPost('user-1', {
          title: post.title,
          content: post.content,
          problemId: 'missing-problem',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.discussPost.create).not.toHaveBeenCalled();
    });
  });

  describe('findPosts', () => {
    it('filters by problemId when provided', async () => {
      await service.findPosts({ problemId: 'problem-1' });

      expect(prisma.discussPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, problemId: 'problem-1' },
        }),
      );
    });

    it('returns upvoted: false for every post and skips the vote lookup for a guest (no userId)', async () => {
      prisma.discussPost.findMany.mockResolvedValue([post]);

      const result = await service.findPosts({});

      expect(result).toEqual([{ ...post, upvoted: false }]);
      expect(prisma.discussPostVote.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findPostById', () => {
    it('throws NotFoundException when the post does not exist', async () => {
      prisma.discussPost.findUnique.mockResolvedValue(null);

      await expect(service.findPostById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.discussPost.update).not.toHaveBeenCalled();
    });

    it('increments viewCount and returns upvoted: false without a vote lookup for a guest', async () => {
      prisma.discussPost.findUnique.mockResolvedValue(post);
      prisma.discussPost.update.mockResolvedValue({ ...post, comments: [] });

      const result = await service.findPostById(post.id);

      expect(prisma.discussPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: post.id },
          data: { viewCount: { increment: 1 } },
        }),
      );
      expect(result).toEqual({ ...post, comments: [], upvoted: false });
      expect(prisma.discussPostVote.findUnique).not.toHaveBeenCalled();
    });

    it('looks up the vote row when a userId is given (logged-in view)', async () => {
      prisma.discussPost.findUnique.mockResolvedValue(post);
      prisma.discussPost.update.mockResolvedValue({ ...post, comments: [] });
      prisma.discussPostVote.findUnique.mockResolvedValue({ id: 'vote-1' });

      const result = await service.findPostById(post.id, 'user-1');

      expect(prisma.discussPostVote.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_postId: { userId: 'user-1', postId: post.id } },
        }),
      );
      expect(result.upvoted).toBe(true);
    });
  });

  describe('createComment', () => {
    it('throws NotFoundException when the post does not exist', async () => {
      prisma.discussPost.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment(post.id, 'user-1', { content: 'hi' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates the comment and increments the post commentCount in the same transaction', async () => {
      prisma.discussPost.findUnique.mockResolvedValue(post);
      prisma.discussComment.create.mockResolvedValue({
        id: 'comment-1',
        content: 'hi',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        author: post.author,
      });

      await service.createComment(post.id, 'user-1', { content: 'hi' });

      expect(prisma.discussComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { postId: post.id, authorId: 'user-1', content: 'hi' },
        }),
      );
      expect(prisma.discussPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: post.id },
          data: { commentCount: { increment: 1 } },
        }),
      );
    });
  });

  describe('toggleVote', () => {
    it('throws NotFoundException when the post does not exist', async () => {
      prisma.discussPost.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleVote(post.id, 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates a vote row and increments upvoteCount when the user has not voted yet', async () => {
      prisma.discussPost.findUnique.mockResolvedValue(post);
      prisma.discussPostVote.findUnique.mockResolvedValue(null);

      const result = await service.toggleVote(post.id, 'user-1');

      expect(result).toEqual({ upvoted: true });
      expect(prisma.discussPostVote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: 'user-1', postId: post.id },
        }),
      );
      expect(prisma.discussPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: post.id },
          data: { upvoteCount: { increment: 1 } },
        }),
      );
      expect(prisma.discussPostVote.delete).not.toHaveBeenCalled();
    });

    it('deletes the vote row and decrements upvoteCount when the user already voted (unvote leaves the count net-zero)', async () => {
      prisma.discussPost.findUnique.mockResolvedValue(post);
      prisma.discussPostVote.findUnique.mockResolvedValue({ id: 'vote-1' });

      const result = await service.toggleVote(post.id, 'user-1');

      expect(result).toEqual({ upvoted: false });
      expect(prisma.discussPostVote.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'vote-1' } }),
      );
      expect(prisma.discussPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: post.id },
          data: { upvoteCount: { decrement: 1 } },
        }),
      );
      expect(prisma.discussPostVote.create).not.toHaveBeenCalled();
    });
  });
});
