import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    example: 'uuid-cua-bai-tap',
    description: 'ID của bài tập muốn làm',
  })
  @IsNotEmpty()
  @IsUUID()
  problemId: string;
}
