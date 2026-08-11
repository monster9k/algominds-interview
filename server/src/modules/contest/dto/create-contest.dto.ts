import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ProblemCountsDto {
  @IsInt()
  @Min(0)
  easy: number;

  @IsInt()
  @Min(0)
  medium: number;

  @IsInt()
  @Min(0)
  hard: number;
}

export class CreateContestDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @ValidateNested()
  @Type(() => ProblemCountsDto)
  problemCounts: ProblemCountsDto;
}
