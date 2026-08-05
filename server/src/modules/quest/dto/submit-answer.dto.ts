import { IsInt, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsInt()
  @Min(0)
  selectedLine: number;
}
