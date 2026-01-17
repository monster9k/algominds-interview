import { Difficulty } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
export class CreateProblemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsObject()
  @IsNotEmpty()
  initialCode: object; // {ts, py}

  @IsObject()
  @IsNotEmpty()
  testCases: object;

  @IsOptional()
  @IsObject()
  exampleCases?: object;

  @IsOptional()
  @IsInt()
  @Min(100)
  timeLimitMs?: number;

  @IsOptional()
  @IsInt()
  @Min(128)
  memoryLimitMb?: number;

  @IsOptional()
  @IsString({ each: true }) // Validate mảng string ["Array", "Hash Table"]
  tags?: string[]; // phan loai bai toan
}
