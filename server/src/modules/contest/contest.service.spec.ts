// jest's `expect.objectContaining`/`expect.arrayContaining` type as `any`,
// which trips no-unsafe-assignment on nested matcher objects below.
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { ContestService, deriveContestStatus } from './contest.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TestExecutionService } from '../code-execution/services/test-execution.service';

interface PrismaMock {
  contest: { findFirst: jest.Mock; findMany: jest.Mock };
  contestProblem: { findFirst: jest.Mock; findMany: jest.Mock };
  contestSubmission: { findMany: jest.Mock; create: jest.Mock };
}

describe('deriveContestStatus', () => {
  const startTime = new Date('2026-08-09T10:00:00Z');
  const endTime = new Date('2026-08-09T12:00:00Z');

  it('returns UPCOMING before startTime', () => {
    expect(
      deriveContestStatus(startTime, endTime, new Date('2026-08-09T09:59:59Z')),
    ).toBe('UPCOMING');
  });

  it('returns ONGOING between startTime and endTime', () => {
    expect(
      deriveContestStatus(startTime, endTime, new Date('2026-08-09T11:00:00Z')),
    ).toBe('ONGOING');
  });

  it('returns FINISHED after endTime', () => {
    expect(
      deriveContestStatus(startTime, endTime, new Date('2026-08-09T12:00:01Z')),
    ).toBe('FINISHED');
  });
});

describe('ContestService', () => {
  let service: ContestService;
  let prisma: PrismaMock;
  let testExecution: { runTestCases: jest.Mock };

  const now = new Date();
  const ongoingContest = {
    id: 'contest-1',
    slug: 'weekly-1',
    title: 'Weekly Contest 1',
    description: 'desc',
    startTime: new Date(now.getTime() - 60 * 60 * 1000), // started 1h ago
    endTime: new Date(now.getTime() + 60 * 60 * 1000), // ends in 1h
  };

  const problem = {
    id: 'problem-1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'EASY',
    content: '<p>...</p>',
    initialCode: {},
    sampleTestCases: [{ input: { nums: [2, 7], target: 9 }, output: [0, 1] }],
    hiddenTestCases: [{ input: { nums: [3, 3], target: 6 }, output: [0, 1] }],
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    functionName: 'twoSum',
  };

  const contestProblem = {
    id: 'cp-1',
    contestId: 'contest-1',
    problemId: 'problem-1',
    points: 100,
    order: 0,
    problem,
  };

  beforeEach(() => {
    prisma = {
      contest: {
        findFirst: jest.fn().mockResolvedValue(ongoingContest),
        findMany: jest.fn().mockResolvedValue([]),
      },
      contestProblem: {
        findFirst: jest.fn().mockResolvedValue(contestProblem),
        findMany: jest.fn().mockResolvedValue([contestProblem]),
      },
      contestSubmission: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
    };

    testExecution = { runTestCases: jest.fn() };

    service = new ContestService(
      prisma as unknown as PrismaService,
      testExecution as unknown as TestExecutionService,
    );
  });

  describe('runContestProblem', () => {
    it('throws NotFoundException when the contest does not exist', async () => {
      prisma.contest.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.runContestProblem(
          'user-1',
          'missing',
          'two-sum',
          'code',
          'javascript',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when the contest has not started yet', async () => {
      prisma.contest.findFirst.mockResolvedValueOnce({
        ...ongoingContest,
        startTime: new Date(now.getTime() + 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      });

      await expect(
        service.runContestProblem(
          'user-1',
          'contest-1',
          'two-sum',
          'code',
          'javascript',
        ),
      ).rejects.toThrow('Cuộc thi chưa bắt đầu');
    });

    it('throws ForbiddenException when the contest has already ended', async () => {
      prisma.contest.findFirst.mockResolvedValueOnce({
        ...ongoingContest,
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 60 * 60 * 1000),
      });

      await expect(
        service.runContestProblem(
          'user-1',
          'contest-1',
          'two-sum',
          'code',
          'javascript',
        ),
      ).rejects.toThrow('Cuộc thi đã kết thúc');
    });

    it('throws NotFoundException when the problem is not attached to the contest', async () => {
      prisma.contestProblem.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.runContestProblem(
          'user-1',
          'contest-1',
          'unknown-slug',
          'code',
          'javascript',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('grades against sampleTestCases only and never persists a ContestSubmission', async () => {
      testExecution.runTestCases.mockResolvedValue({
        results: [{ status: SubmissionStatus.ACCEPTED }],
        passedTests: 1,
        finalStatus: SubmissionStatus.ACCEPTED,
        executionTime: 12,
        memoryUsage: 500,
      });

      const result = await service.runContestProblem(
        'user-1',
        'contest-1',
        'two-sum',
        'code',
        'javascript',
      );

      expect(testExecution.runTestCases).toHaveBeenCalledWith(
        'javascript',
        'code',
        'twoSum',
        problem.sampleTestCases,
        { timeLimitMs: 1000, memoryLimitMb: 256 },
      );
      expect(result.status).toBe(SubmissionStatus.ACCEPTED);
      expect(result.totalTests).toBe(1);
      expect(prisma.contestSubmission.create).not.toHaveBeenCalled();
    });
  });

  describe('submitContestProblem', () => {
    it('grades against sample+hidden and writes penaltyMinutes 0 when ACCEPTED', async () => {
      testExecution.runTestCases.mockResolvedValue({
        results: [
          { status: SubmissionStatus.ACCEPTED },
          { status: SubmissionStatus.ACCEPTED },
        ],
        passedTests: 2,
        finalStatus: SubmissionStatus.ACCEPTED,
        executionTime: 20,
        memoryUsage: 800,
      });
      prisma.contestSubmission.create.mockResolvedValue({
        id: 'sub-1',
        status: SubmissionStatus.ACCEPTED,
      });

      await service.submitContestProblem(
        'user-1',
        'contest-1',
        'two-sum',
        'code',
        'javascript',
      );

      expect(testExecution.runTestCases).toHaveBeenCalledWith(
        'javascript',
        'code',
        'twoSum',
        [...problem.sampleTestCases, ...problem.hiddenTestCases],
        { timeLimitMs: 1000, memoryLimitMb: 256 },
      );
      expect(prisma.contestSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contestId: 'contest-1',
          userId: 'user-1',
          problemId: 'problem-1',
          status: SubmissionStatus.ACCEPTED,
          penaltyMinutes: 0,
          totalTests: 2,
        }),
      });
    });

    it('writes penaltyMinutes 20 when the submission is not ACCEPTED', async () => {
      testExecution.runTestCases.mockResolvedValue({
        results: [{ status: SubmissionStatus.WRONG_ANSWER }],
        passedTests: 0,
        finalStatus: SubmissionStatus.WRONG_ANSWER,
        executionTime: 5,
        memoryUsage: 400,
      });
      prisma.contestSubmission.create.mockResolvedValue({
        id: 'sub-2',
        status: SubmissionStatus.WRONG_ANSWER,
      });

      await service.submitContestProblem(
        'user-1',
        'contest-1',
        'two-sum',
        'code',
        'javascript',
      );

      expect(prisma.contestSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ penaltyMinutes: 20 }),
      });
    });

    it('throws ForbiddenException and writes nothing when the contest has ended', async () => {
      prisma.contest.findFirst.mockResolvedValueOnce({
        ...ongoingContest,
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 60 * 60 * 1000),
      });

      await expect(
        service.submitContestProblem(
          'user-1',
          'contest-1',
          'two-sum',
          'code',
          'javascript',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.contestSubmission.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the problem is not attached to the contest', async () => {
      prisma.contestProblem.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.submitContestProblem(
          'user-1',
          'contest-1',
          'unknown-slug',
          'code',
          'javascript',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.contestSubmission.create).not.toHaveBeenCalled();
    });
  });

  // getLeaderboard's scoring/penalty algorithm itself is unchanged by this
  // work, but the module had zero test coverage of any kind before this file
  // — lock in current behavior so future changes nearby don't silently break it.
  describe('getLeaderboard (regression)', () => {
    it('ranks by score desc, then penalty asc, and stops accumulating once a problem is solved', async () => {
      prisma.contestProblem.findMany.mockResolvedValueOnce([
        { problemId: 'p1', points: 100, order: 0 },
        { problemId: 'p2', points: 300, order: 1 },
      ]);
      const t0 = ongoingContest.startTime.getTime();
      prisma.contestSubmission.findMany.mockResolvedValueOnce([
        // user-A: wrong then accepted on p1 only (20min penalty + time-to-solve)
        {
          userId: 'user-A',
          problemId: 'p1',
          status: SubmissionStatus.WRONG_ANSWER,
          submittedAt: new Date(t0 + 5 * 60000),
          penaltyMinutes: 20,
          user: { id: 'user-A', name: 'Alice', avatarUrl: null },
        },
        {
          userId: 'user-A',
          problemId: 'p1',
          status: SubmissionStatus.ACCEPTED,
          submittedAt: new Date(t0 + 10 * 60000),
          penaltyMinutes: 0,
          user: { id: 'user-A', name: 'Alice', avatarUrl: null },
        },
        // user-B: accepted p1 immediately, then accepted p2 too -> higher score
        {
          userId: 'user-B',
          problemId: 'p1',
          status: SubmissionStatus.ACCEPTED,
          submittedAt: new Date(t0 + 3 * 60000),
          penaltyMinutes: 0,
          user: { id: 'user-B', name: 'Bob', avatarUrl: null },
        },
        {
          userId: 'user-B',
          problemId: 'p2',
          status: SubmissionStatus.ACCEPTED,
          submittedAt: new Date(t0 + 8 * 60000),
          penaltyMinutes: 0,
          user: { id: 'user-B', name: 'Bob', avatarUrl: null },
        },
      ]);

      const leaderboard = await service.getLeaderboard('contest-1');

      expect(leaderboard[0]).toMatchObject({
        rank: 1,
        userId: 'user-B',
        totalScore: 400,
        solvedCount: 2,
      });
      expect(leaderboard[1]).toMatchObject({
        rank: 2,
        userId: 'user-A',
        totalScore: 100,
        totalPenaltyMinutes: 30, // 20 (wrong attempt) + 10 (time-to-solve)
        solvedCount: 1,
      });
    });
  });
});
