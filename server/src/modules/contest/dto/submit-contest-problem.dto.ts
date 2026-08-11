import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SUPPORTED_LANGUAGES } from '../../code-execution/language.constants';

// contestId/problemSlug đến từ route param, không nhận trong body — tránh
// trust client gửi kèm 1 contestId khác với URL đang gọi.
export class SubmitContestProblemDto {
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
