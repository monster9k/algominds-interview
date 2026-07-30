import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

// Phải khớp với các key trong PistonService.getLanguageConfig() — ngôn ngữ lạ
// sẽ bị chặn ở đây thay vì fallback âm thầm về "node".
export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'node',
  'python',
  'cpp',
  'c++',
  'c',
  'java',
] as const;

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
