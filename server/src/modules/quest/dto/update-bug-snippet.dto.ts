import { Difficulty } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateBugSnippetDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  buggyLine?: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
