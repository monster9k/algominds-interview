import { IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  @MinLength(6, { message: 'Mat khau phai co it nhat 6 ky tu' })
  password: string;
}
