import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

interface StageCompletedPayload {
  stageId: string;
}

@Injectable()
export class CareerListener {
  private readonly logger = new Logger(CareerListener.name);

  constructor(@InjectQueue('debrief-queue') private debriefQueue: Queue) {}

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
}
