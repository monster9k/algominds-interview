import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleValidatedUser } from '../../../common/types/google-validated-user.type';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'], // Thêm prompt vào scope
    });
  }

  validate(
    accessToken: string,
    refreshToken: string, // dung de xin moi  khi accessToken het han
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { name, emails, photos, id } = profile;
    const user: GoogleValidatedUser = {
      email: emails?.[0]?.value ?? '',
      name: `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim(),
      avatarUrl: photos?.[0]?.value ?? '',
      providerId: id,
      provider: 'google',
    };

    done(null, user); //done: VerifyCallback – Báo cho Passport biết “xong rồi” -- Auth thành công hay thất bại
  }
}
