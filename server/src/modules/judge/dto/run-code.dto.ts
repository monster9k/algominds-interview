import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { SUPPORTED_LANGUAGES } from './submit-code.dto';

export class RunCodeDto {
  @ApiProperty({ description: 'ID của session đang làm bài' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Code người dùng muốn chạy thử' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  code: string;

  @ApiProperty({ enum: SUPPORTED_LANGUAGES })
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES)
  language: string;
}
