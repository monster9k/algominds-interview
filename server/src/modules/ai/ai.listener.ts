import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AiListener {
  private readonly logger = new Logger(AiListener.name);

  constructor(@InjectQueue('ai-queue') private aiQueue: Queue) {}

  @OnEvent('submission.accepted')
  async handleSubmissionAccepted(payload: {
    sessionId: string;
    userId: string;
    code: string;
    language: string;
  }) {
    try {
      this.logger.log(
        `[submission.accepted] Received event for session: ${payload.sessionId}`,
      );

      // Add job to ai-queue for code evaluation
      const job = await this.aiQueue.add(
        'evaluate-code', // Job type
        {
          sessionId: payload.sessionId,
          userId: payload.userId,
          code: payload.code,
          language: payload.language,
        },
        {
          attempts: 3, // Retry 3 times if failed
          backoff: {
            type: 'exponential',
            delay: 2000, // 2s base delay
          },
          removeOnComplete: true, // Remove from queue after success
          removeOnFail: false, // Keep failed jobs for debugging
        },
      );

      this.logger.log(
        `[submission.accepted] Added evaluate-code job: ${job.id} for session: ${payload.sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `[submission.accepted] Error adding job to queue:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
