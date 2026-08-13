import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { LinkGoogleTicketPayload } from '../../common/types/link-google-ticket-payload.type';

// Ép Google luôn hiện màn hình chọn tài khoản VÀ màn hình xác nhận quyền
// (consent) - "select_account" không tự động ép hiện lại consent nếu app đã
// từng được cấp quyền trước đó, nên cần cộng thêm "consent" vào cùng prompt.
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private jwtService: JwtService) {
    super();
  }

  // Dùng chung cho cả GET /auth/google (login thường) và GET /auth/google/link
  // (flow "Connect Google" — xem account-linking roadmap). Nếu request mang
  // ?ticket=<link ticket hợp lệ>, gắn ticket đó làm `state` của OAuth request
  // để Google echo lại y nguyên ở callback (không lưu server-side) —
  // auth.controller.ts#googleAuthRedirect() đọc lại state để biết đây là
  // link hay login. Ticket sai/hết hạn -> từ chối luôn ở đây, không cho
  // round-trip vô ích sang Google.
  async getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const ticket = req.query.ticket as string | undefined;

    if (ticket) {
      let payload: LinkGoogleTicketPayload;
      try {
        payload = await this.jwtService.verifyAsync<LinkGoogleTicketPayload>(
          ticket,
          { secret: process.env.JWT_SECRET },
        );
      } catch {
        throw new UnauthorizedException(
          'Link ticket không hợp lệ hoặc đã hết hạn',
        );
      }
      if (payload.purpose !== 'link_google') {
        throw new UnauthorizedException('Link ticket không hợp lệ');
      }
      return { prompt: 'select_account consent', state: ticket };
    }

    return { prompt: 'select_account consent' };
  }
}
