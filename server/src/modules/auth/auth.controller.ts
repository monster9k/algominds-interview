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
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';

import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import type { GoogleValidatedUser } from '../../common/types/google-validated-user.type';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

// Route nhạy cảm brute-force (login/register/refresh) — chặt hơn nhiều so
// với default 60/60s dùng cho các route đọc thông thường.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private getRefreshCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', //
      sameSite: 'lax' as const, //
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  @Throttle(AUTH_THROTTLE)
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Throttle(AUTH_THROTTLE)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie(
      'refreshToken',
      result.refreshToken,
      this.getRefreshCookieOptions(),
    );

    return {
      accessToken: result.access_token,
      user: result.user,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard) //BẮT BUỘC PHẢI CÓ TOKEN MỚI ĐƯỢC VÀO
  getProfile(@CurrentUser() user: RequestUser) {
    return {
      message: 'Đây là thông tin mật',
      user: user, // User này được lấy từ Token giải mã ra
    };
  }

  // --- GOOGLE OAUTH ---

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard tự chuyển hướng, không cần code
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Đây là 1 browser redirect flow, không phải JSON API — nếu throw thẳng
    // exception thì user sẽ thấy trang lỗi 401 thô thay vì quay lại app.
    let user: Awaited<ReturnType<typeof this.authService.validateGoogleUser>>;
    try {
      // This route is guarded by AuthGuard('google'), so req.user is always
      // the GoogleValidatedUser shape GoogleStrategy.validate() set — not
      // the JWT RequestUser shape most other guarded routes see.
      user = await this.authService.validateGoogleUser(
        req.user as GoogleValidatedUser,
      );
    } catch {
      return res.redirect(
        `${frontendUrl}/auth/login?error=google_account_conflict`,
      );
    }

    // 2. Tạo Token cho user này
    const data = await this.authService.issueTokensForUser(user);

    res.cookie(
      'refreshToken',
      data.refreshToken,
      this.getRefreshCookieOptions(),
    );

    return res.redirect(`${frontendUrl}/auth/google-callback`);
  }

  @Throttle(AUTH_THROTTLE)
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException(
        'Không tìm thấy Refresh Token trong Cookie',
      );
    }

    const newTokens = await this.authService.refreshTokens(refreshToken);

    res.cookie(
      'refreshToken',
      newTokens.refreshToken,
      this.getRefreshCookieOptions(),
    );

    return {
      accessToken: newTokens.access_token,
      user: newTokens.user,
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    res.clearCookie('refreshToken', this.getRefreshCookieOptions());

    return {
      message: 'Đăng xuất thành công',
    };
  }
}
