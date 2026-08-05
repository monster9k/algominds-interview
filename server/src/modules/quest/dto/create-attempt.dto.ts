import { Difficulty } from '@prisma/client';
import { IsEnum, IsInt, Min } from 'class-validator';

export class CreateAttemptDto {
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsInt()
  @Min(0)
  score: number;

  @IsInt()
  @Min(0)
  correctCount: number;

  @IsInt()
  @Min(0)
  wrongCount: number;

  @IsInt()
  @Min(0)
  bestCombo: number;

  @IsInt()
  @Min(0)
  durationMs: number;
}
