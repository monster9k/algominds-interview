import { ShopItemCategory } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateShopItemDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(ShopItemCategory)
  category: ShopItemCategory;

  @IsInt()
  @Min(0)
  price: number;

  @IsNotEmpty()
  @IsString()
  iconKey: string;
}
