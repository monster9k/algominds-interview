import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @IsNotEmpty({ message: 'Ten tai khoan khong duoc de trong' })
  name: string;

  @IsOptional() // <-- cho phép ko gởi password
  @IsString()
  @MinLength(6, { message: 'Mat khau phai co it nhat 6 ky tu' })
  password?: string;
  @IsOptional()
  provider?: string;

  @IsOptional()
  providerId?: string;

  @IsOptional()
  avatarUrl?: string;
}
