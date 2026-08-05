import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CareerService } from './career.service';

interface StageCompletedPayload {
  stageId: string;
}

interface EvaluationCompletedPayload {
  sessionId: string;
  scores: {
    logic: number;
    cleanCode: number;
    performance: number;
    bestPractices: number;
  };
}

@Injectable()
export class CareerListener {
  private readonly logger = new Logger(CareerListener.name);

  constructor(
    @InjectQueue('debrief-queue') private debriefQueue: Queue,
    private careerService: CareerService,
  ) {}

  @OnEvent('career.stage.completed')
  async handleStageCompleted(payload: StageCompletedPayload) {
    try {
      const job = await this.debriefQueue.add(
        'generate-offer-debrief',
        { stageId: payload.stageId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(
        `[career.stage.completed] Added generate-offer-debrief job: ${job.id} for stage: ${payload.stageId}`,
      );
    } catch (error) {
      this.logger.error(
        `[career.stage.completed] Error adding job to queue:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // P4 — emit từ ai.processor.ts#processEvaluateCode sau mỗi lần Evaluation
  // được lưu. Session không thuộc career journey nào (hoặc stage không phải
  // PROBLEM đang ACTIVE) thì handleEvaluationCompleted tự bỏ qua, không phá
  // hành vi Phase 2 thường của sessions/chat.
  @OnEvent('evaluation.completed')
  async handleEvaluationCompleted(payload: EvaluationCompletedPayload) {
    try {
      await this.careerService.handleEvaluationCompleted(
        payload.sessionId,
        payload.scores,
      );
    } catch (error) {
      this.logger.error(
        `[evaluation.completed] Error auto-grading career stage for session ${payload.sessionId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
