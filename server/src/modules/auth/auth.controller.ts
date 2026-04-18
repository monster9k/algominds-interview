import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res) {
    const result = await this.authService.login(loginDto);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    return {
      accessToken: result.access_token,
      user: result.user,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard) //BẮT BUỘC PHẢI CÓ TOKEN MỚI ĐƯỢC VÀO
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'Đây là thông tin mật',
      user: user, // User này được lấy từ Token giải mã ra
    };
  }

  // --- GOOGLE OAUTH ---

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Guard tự chuyển hướng, không cần code
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    // 1. Lấy hoặc Tạo user từ DB
    const user = await this.authService.validateGoogleUser(req.user);

    // 2. Tạo Token cho user này
    const data = await this.authService.generateToken(
      user.id,
      user.email,
      user.role,
    );
    const frontendUrl = this.configService.get<String>('FRONTEND_URL');

    // đóng gói use vào 1 chuỗi gọn gàng để truyền qua URL
    const userParam = encodeURIComponent(JSON.stringify(data.user));
    // 3. Trả về kết quả
    // *Lưu ý: Khi làm Frontend thật, ta sẽ res.redirect() về trang React

    return res.redirect(
      `${frontendUrl}/auth/google-callback?accessToken=${data.access_token}&user=${userParam}`,
    );
  }

  @Post('refresh')
  async refreshToken(@Req() req, @Res({ passthrough: true }) res) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException(
        'Không tìm thấy Refresh Token trong Cookie',
      );
    }

    const newTokens = await this.authService.refreshTokens(refreshToken);


  }
}
