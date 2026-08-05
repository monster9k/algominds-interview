import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class AdvanceJourneyDto {
  @ApiProperty({
    enum: ['PASSED', 'FAILED'],
    example: 'PASSED',
    description:
      'Kết quả của stage đang ACTIVE. Chưa có cơ chế tự suy ra từ Session/QuestAttempt (SessionStatus hiện tại không có transition sang COMPLETED/ABANDONED ở bất kỳ đâu trong codebase), nên caller phải khai báo tường minh.',
  })
  @IsIn(['PASSED', 'FAILED'])
  status: 'PASSED' | 'FAILED';
}
