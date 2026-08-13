import { Difficulty } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBugSnippetDto {
  @IsNotEmpty()
  @IsString()
  language: string;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsInt()
  @Min(0)
  buggyLine: number;

  @IsOptional()
  @IsString()
  explanation?: string;
}
