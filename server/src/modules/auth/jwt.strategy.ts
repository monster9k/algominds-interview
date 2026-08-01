import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { RequestUser } from '../../common/types/request-user.type';
@Injectable() // req.User giong nodejs
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    // Refresh token cũng ký bằng cùng JWT_SECRET và có đủ sub/email/role,
    // nên phải chặn tường minh ở đây để nó không dùng được như access token.
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return {
      userId: payload.sub,
      username: payload.email,
      role: payload.role,
    };
  }
}

// Request
//  → JwtAuthGuard
//    → Passport
//      → JwtStrategy
//        → verify token
//        → validate(payload)
//          → return user
//            → request.user
//              → @CurrentUser()
