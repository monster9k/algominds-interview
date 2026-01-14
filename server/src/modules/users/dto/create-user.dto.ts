import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @IsNotEmpty({ message: 'Ten tai khoan khong duoc de trong' })
  name: string;

  @IsString()
  @MinLength(6, { message: 'Mat khau phai co it nhat 6 ky tu' })
  password: string;
  
}
