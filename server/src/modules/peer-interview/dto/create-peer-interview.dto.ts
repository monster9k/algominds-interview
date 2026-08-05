import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePeerInterviewDto {
  @ApiProperty({
    description:
      'Bài toán dùng cho buổi peer interview (thuần hội thoại, không tích hợp Judge/Piston).',
  })
  @IsUUID()
  problemId: string;
}
