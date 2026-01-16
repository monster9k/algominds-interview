import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const resultUser = { email: user.email, name: user.name };
    return {
      message: 'Đăng ký thành công',
      user: resultUser,
    };
  }

  // Hàm này chỉ lo việc ký giấy thông hành, không lo check pass
  async generateToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { userId, email, role }, // Trả thêm info để Frontend dùng
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.password) {
      // Nếu user ko có pass (user Google) thì chặn luôn
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // Pass đúng -> Gọi hàm tạo token
    return this.generateToken(user.id, user.email, user.role);
  }

  async validateGoogleUser(googleUser: any) {
    const { email, name, avatarUrl, providerId } = googleUser;

    // A. Kiểm tra user đã tồn tại chưa?
    const user = await this.usersService.findByEmail(email);

    if (user) {
      // Nếu đã có -> Trả về luôn để login
      // (Optional: Update avatar nếu muốn, nhưng để đơn giản ta cứ return)
      return user;
    }

    // B. Nếu chưa có -> Tạo mới (Register)
    console.log('User Google mới, đang tạo vào DB...');

    const newUser = await this.usersService.create({
      email,
      name,
      password: undefined, // Schema cho phép null -> Chuẩn bài!
      provider: 'google',
      providerId: providerId,
      avatarUrl: avatarUrl,
    });

    return newUser;
  }
}
