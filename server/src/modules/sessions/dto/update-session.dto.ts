import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { SessionStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSessionDto {
  @ApiProperty({
    description: 'Phiên bản hiện tại của session dưới client',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  version: number; // <--- CÁI QUAN TRỌNG NHẤT HÔM NAY

  @ApiProperty({ required: false, enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  strategyAnswer?: string; // User trả lời câu hỏi chiến lược

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currentCode?: string; // User lưu code nháp
}
