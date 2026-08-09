import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { SUPPORTED_LANGUAGES } from '../../code-execution/language.constants';

export { SUPPORTED_LANGUAGES };

export class SubmitCodeDto {
  @ApiProperty({ description: 'ID của session đang làm bài' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Code người dùng nộp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  code: string;

  @ApiProperty({ enum: SUPPORTED_LANGUAGES })
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES)
  language: string;
}
