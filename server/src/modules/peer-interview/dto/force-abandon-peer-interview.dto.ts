import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ForceAbandonPeerInterviewDto {
  @ApiProperty({
    enum: ['ABANDONED'],
    example: 'ABANDONED',
    description:
      'Admin force-update status của 1 phiên peer interview bị kẹt. Chỉ chấp nhận ABANDONED — không cho set WAITING_FOR_PEER/ACTIVE/COMPLETED thủ công vì các status đó do luồng join/chấm điểm tự quản lý.',
  })
  @IsIn(['ABANDONED'])
  status: 'ABANDONED';
}
