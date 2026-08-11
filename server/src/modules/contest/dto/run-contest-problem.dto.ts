import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SUPPORTED_LANGUAGES } from '../../code-execution/language.constants';

export class RunContestProblemDto {
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
