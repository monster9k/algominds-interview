import {
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { LinkGoogleTicketPayload } from '../../common/types/link-google-ticket-payload.type';

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
    private jwtService: JwtService,
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
      dailyReward: result.dailyReward,
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

  // Bước 1 của flow "Connect Google" (Settings, chiều email-first) — xác
  // thực lại mật khẩu hiện tại (step-up auth) trước khi cho phép liên kết,
  // trả về link ticket ngắn hạn để FE tiếp tục sang GET /auth/google/link.
  @Throttle(AUTH_THROTTLE)
  @Post('verify-password')
  @UseGuards(JwtAuthGuard)
  async verifyPassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: VerifyPasswordDto,
  ) {
    const ticket = await this.authService.verifyPasswordAndIssueLinkTicket(
      user.userId,
      dto.password,
    );
    return { ticket };
  }

  // --- GOOGLE OAUTH ---

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard tự chuyển hướng, không cần code
  }

  // Bước 2 của flow "Connect Google" — cùng route handler với /auth/google
  // (GoogleAuthGuard tự đọc ?ticket= và gắn vào `state` OAuth), tách route
  // riêng chỉ để rõ ý nghĩa phía FE/API docs.
  @Get('google/link')
  @UseGuards(GoogleAuthGuard)
  googleAuthLink() {
    // Guard tự chuyển hướng, không cần code
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // This route is guarded by AuthGuard('google'), so req.user is always
    // the GoogleValidatedUser shape GoogleStrategy.validate() set — not
    // the JWT RequestUser shape most other guarded routes see.
    const googleUser = req.user as GoogleValidatedUser;

    // `state` được Google echo lại y nguyên từ request ban đầu —
    // GoogleAuthGuard chỉ gắn state khi request có ?ticket= hợp lệ (flow
    // "Connect Google" từ Settings). Có state hợp lệ -> đây là link, không
    // phải login — route sang linkGoogleAccount() thay vì validateGoogleUser().
    if (state) {
      let ticketPayload: LinkGoogleTicketPayload;
      try {
        ticketPayload =
          await this.jwtService.verifyAsync<LinkGoogleTicketPayload>(state, {
            secret: process.env.JWT_SECRET,
          });
      } catch {
        return res.redirect(`${frontendUrl}/settings?error=invalid_ticket`);
      }

      try {
        await this.authService.linkGoogleAccount(ticketPayload.sub, googleUser);
      } catch (err) {
        const errorCode =
          err instanceof ConflictException
            ? 'google_already_linked'
            : 'google_email_mismatch';
        return res.redirect(`${frontendUrl}/settings?error=${errorCode}`);
      }

      // User vốn đã đăng nhập từ trước (đây là redirect trong lúc đang ở
      // Settings) — không cần cấp lại token, chỉ báo thành công cho FE.
      return res.redirect(`${frontendUrl}/settings?linked=google`);
    }

    // Đây là 1 browser redirect flow, không phải JSON API — nếu throw thẳng
    // exception thì user sẽ thấy trang lỗi 401 thô thay vì quay lại app.
    let validated: Awaited<
      ReturnType<typeof this.authService.validateGoogleUser>
    >;
    try {
      validated = await this.authService.validateGoogleUser(googleUser);
    } catch {
      return res.redirect(
        `${frontendUrl}/auth/login?error=google_account_conflict`,
      );
    }

    // 2. Tạo Token cho user này
    const { user, dailyReward } = validated;
    const data = await this.authService.issueTokensForUser(user);

    res.cookie(
      'refreshToken',
      data.refreshToken,
      this.getRefreshCookieOptions(),
    );

    // FE gọi POST /auth/refresh để lấy access token (không đọc được body của
    // redirect này) — gắn dailyReward qua query param để google-callback-page
    // vẫn hiện được toast "+1 xu" dù đi qua đường refresh, không phải login.
    const rewardParam = dailyReward.awarded ? '&dailyReward=1' : '';
    return res.redirect(
      `${frontendUrl}/auth/google-callback?ok=1${rewardParam}`,
    );
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
