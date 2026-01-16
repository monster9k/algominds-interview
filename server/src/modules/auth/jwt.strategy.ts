import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable() // req.User giong nodejs
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
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
