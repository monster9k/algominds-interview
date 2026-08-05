import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SessionStatus, StageKind } from '@prisma/client';

interface DebriefJobData {
  stageId: string;
}

// Chưa đủ answer thì bỏ qua lần trigger này — không tạo digest chỉ từ 1
// người (không phải "tổng hợp nhiều hướng tiếp cận").
const MIN_ANSWERS_TO_GENERATE = 2;
// Có digest cũ rồi thì chỉ tái tạo khi có ĐỦ answer mới, tránh tốn Gemini call
// mỗi lần có thêm đúng 1 người approve — đúng tinh thần "tái tạo định kỳ khi
// đủ dữ liệu mới" trong roadmap, không phải "mỗi lần trigger".
const MIN_NEW_ANSWERS_TO_REGENERATE = 2;
// Giới hạn số answer đưa vào 1 lần gọi Gemini — tránh prompt phình to vô hạn
// khi 1 bài toán phổ biến có hàng trăm session approved.
const MAX_ANSWERS_PER_DIGEST = 15;

@Processor('debrief-queue')
export class CareerProcessor extends WorkerHost {
  private readonly logger = new Logger(CareerProcessor.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<DebriefJobData>): Promise<unknown> {
    if (job.name !== 'generate-offer-debrief') {
      this.logger.warn(`Unknown job type: ${job.name}`);
      return;
    }
    return this.generateDebrief(job.data.stageId);
  }

  private async generateDebrief(stageId: string) {
    const stage = await this.prisma.careerTrackStage.findUnique({
      where: { id: stageId },
      include: { problem: true, digest: true },
    });

    if (!stage || stage.kind !== StageKind.PROBLEM || !stage.problem) {
      return;
    }

    // "Session đã APPROVED" = session đã rời khỏi PHASE_1_STRATEGY. Codebase
    // hiện tại không có transition nào sang COMPLETED (xem ghi chú ở mục
    // career module trong roadmap P0) nên PHASE_2_IMPLEMENT là tín hiệu duy
    // nhất, COMPLETED được liệt kê thêm để tương thích nếu gap đó được vá sau.
    const approvedSessions = await this.prisma.session.findMany({
      where: {
        problemId: stage.problemId!,
        strategyAnswer: { not: null },
        status: {
          in: [SessionStatus.PHASE_2_IMPLEMENT, SessionStatus.COMPLETED],
        },
      },
      select: { strategyAnswer: true },
      distinct: ['strategyAnswer'],
      orderBy: { startedAt: 'desc' },
      take: MAX_ANSWERS_PER_DIGEST,
    });

    const answers = approvedSessions
      .map((s) => s.strategyAnswer)
      .filter((a): a is string => !!a && a.trim().length > 0);

    if (answers.length < MIN_ANSWERS_TO_GENERATE) {
      this.logger.log(
        `[debrief] Stage ${stageId}: chỉ có ${answers.length} answer, chưa đủ để tổng hợp.`,
      );
      return;
    }

    if (
      stage.digest &&
      answers.length < stage.digest.sourceCount + MIN_NEW_ANSWERS_TO_REGENERATE
    ) {
      this.logger.log(
        `[debrief] Stage ${stageId}: có ${answers.length} answer nhưng digest cũ đã dựa trên ${stage.digest.sourceCount} — chưa đủ mới để tái tạo.`,
      );
      return;
    }

    const problem = stage.problem;
    const problemContext = `
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Description:
${problem.content}
    `;

    const content = await this.aiService.generateOfferDebrief(
      answers,
      problemContext,
    );

    await this.prisma.stageDigest.upsert({
      where: { stageId },
      update: { content, sourceCount: answers.length, generatedAt: new Date() },
      create: { stageId, content, sourceCount: answers.length },
    });

    this.logger.log(
      `[debrief] Stage ${stageId}: đã tạo/cập nhật digest từ ${answers.length} answer.`,
    );
  }
}
