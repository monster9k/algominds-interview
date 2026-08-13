import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCareerTrackDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}
