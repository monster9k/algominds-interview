import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class AdvanceJourneyDto {
  @ApiProperty({
    enum: ['PASSED', 'FAILED'],
    example: 'PASSED',
    description:
      'Kết quả của stage đang ACTIVE. Chỉ dùng cho stage kind=QUEST (auto-grade thật ở P5) — stage kind=PROBLEM giờ auto-grade qua kết quả nộp bài (P4), gọi endpoint này cho stage PROBLEM sẽ bị từ chối (400).',
  })
  @IsIn(['PASSED', 'FAILED'])
  status: 'PASSED' | 'FAILED';
}
