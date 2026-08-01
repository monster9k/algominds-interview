// jest's `expect.objectContaining` types as `any`, which trips
// no-unsafe-assignment on every nested matcher object below.
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { JudgeService } from './judge.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CodeGeneratorService } from './services/code-generator.service';
import { PistonService } from './services/piston.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface PrismaMock {
  session: { findUnique: jest.Mock; update: jest.Mock };
  submission: { create: jest.Mock; findMany: jest.Mock };
  userStats: { upsert: jest.Mock };
  evaluation: { findUnique: jest.Mock };
  $transaction: jest.Mock;
}

describe('JudgeService', () => {
  let service: JudgeService;
  let prisma: PrismaMock;
  let codeGenerator: { prepareRunnableCode: jest.Mock };
  let pistonService: { execute: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  const problem = {
    id: 'problem-1',
    functionName: 'twoSum',
    testCases: [{ input: { nums: [2, 7], target: 9 }, output: [0, 1] }],
    timeLimitMs: 1000,
    memoryLimitMb: 256,
  };

  const session = {
    id: 'session-1',
    userId: 'user-1',
    problemId: 'problem-1',
    problem,
  };

  beforeEach(() => {
    prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue(session),
        update: jest.fn(),
      },
      submission: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      userStats: {
        upsert: jest.fn(),
      },
      evaluation: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(
        async (arg: ((tx: PrismaMock) => unknown) | unknown[]) => {
          if (typeof arg === 'function') {
            return arg(prisma);
          }
          return Promise.all(arg);
        },
      ),
    };

    codeGenerator = {
      prepareRunnableCode: jest
        .fn()
        .mockReturnValue({ code: 'runnable', stdin: undefined }),
    };

    pistonService = {
      execute: jest.fn(),
    };

    eventEmitter = { emit: jest.fn() };

    service = new JudgeService(
      prisma as unknown as PrismaService,
      codeGenerator as unknown as CodeGeneratorService,
      pistonService as unknown as PistonService,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('submitCode', () => {
    it('marks the submission ACCEPTED, awards stats, completes the session and emits the evaluation event when output matches', async () => {
      pistonService.execute.mockResolvedValue({
        output: '[0,1]',
        error: null,
        timeMs: 12,
        memoryKb: 1000,
      });
      prisma.submission.create.mockResolvedValue({
        id: 'sub-1',
        status: SubmissionStatus.ACCEPTED,
        language: 'javascript',
      });

      const result = (await service.submitCode(
        'user-1',
        'session-1',
        'code',
        'javascript',
      )) as { evaluationStatus: string };

      expect(prisma.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubmissionStatus.ACCEPTED,
            passedTests: 1,
            totalTests: 1,
          }),
        }),
      );
      expect(prisma.userStats.upsert).toHaveBeenCalled();
      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-1' },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'submission.accepted',
        expect.objectContaining({
          submissionId: 'sub-1',
          sessionId: 'session-1',
        }),
      );
      expect(result.evaluationStatus).toBe('PENDING');
    });

    it('marks the submission WRONG_ANSWER and skips stats/evaluation event when output does not match', async () => {
      pistonService.execute.mockResolvedValue({
        output: '[9,9]',
        error: null,
        timeMs: 5,
        memoryKb: 500,
      });
      prisma.submission.create.mockResolvedValue({
        id: 'sub-2',
        status: SubmissionStatus.WRONG_ANSWER,
        language: 'javascript',
      });

      const result = (await service.submitCode(
        'user-1',
        'session-1',
        'code',
        'javascript',
      )) as { evaluationStatus: string };

      expect(prisma.userStats.upsert).not.toHaveBeenCalled();
      expect(prisma.session.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(result.evaluationStatus).toBe('NOT_AVAILABLE');
    });

    it('passes the problem timeLimitMs/memoryLimitMb through to PistonService.execute', async () => {
      pistonService.execute.mockResolvedValue({
        output: '[0,1]',
        error: null,
        timeMs: 1,
        memoryKb: 1,
      });
      prisma.submission.create.mockResolvedValue({
        id: 'sub-3',
        status: SubmissionStatus.ACCEPTED,
        language: 'javascript',
      });

      await service.submitCode('user-1', 'session-1', 'code', 'javascript');

      expect(pistonService.execute).toHaveBeenCalledWith(
        'javascript',
        'runnable',
        undefined,
        { timeLimitMs: 1000, memoryLimitMb: 256 },
      );
    });

    it('throws NotFoundException when the session does not belong to the caller', async () => {
      prisma.session.findUnique.mockResolvedValueOnce({
        ...session,
        userId: 'someone-else',
      });

      await expect(
        service.submitCode('user-1', 'session-1', 'code', 'javascript'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the problem has no test cases', async () => {
      prisma.session.findUnique.mockResolvedValueOnce({
        ...session,
        problem: { ...problem, testCases: [] },
      });

      await expect(
        service.submitCode('user-1', 'session-1', 'code', 'javascript'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getSessionSubmissions', () => {
    it('throws NotFoundException for a session owned by another user', async () => {
      prisma.session.findUnique.mockResolvedValueOnce({
        id: 'session-1',
        userId: 'someone-else',
        problemId: 'problem-1',
      });

      await expect(
        service.getSessionSubmissions('user-1', 'session-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
