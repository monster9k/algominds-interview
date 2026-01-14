import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
