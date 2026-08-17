// jest's `expect.objectContaining` types as `any`, which trips
// no-unsafe-assignment on every nested matcher object below.
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcrypt');

interface PrismaMock {
  user: { findUnique: jest.Mock; update: jest.Mock };
  refreshToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
    recordDailyLogin: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let prisma: PrismaMock;

  const activeUser = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'hashed-password',
    role: 'USER',
    provider: 'email',
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      recordDailyLogin: jest.fn().mockResolvedValue({ awarded: false }),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    };
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      prisma as unknown as PrismaService,
    );

    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset().mockResolvedValue('hashed-token');
  });

  describe('login', () => {
    it('rejects when no user exists for the email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a Google-only account (no password set) trying to log in with a password', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...activeUser,
        password: null,
      });

      await expect(
        service.login({ email: activeUser.email, password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: activeUser.email, password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues an access token with type "access" and a refresh token with type "refresh" on success', async () => {
      usersService.findByEmail.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: activeUser.email,
        password: 'correct',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: activeUser.id, type: 'access' }),
        { expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: activeUser.id, type: 'refresh' }),
        { expiresIn: '7d' },
      );
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.access_token).toBe('signed-token');
      expect(usersService.recordDailyLogin).toHaveBeenCalledTimes(1);
      expect(usersService.recordDailyLogin).toHaveBeenCalledWith(activeUser.id);
      expect(result.dailyReward).toEqual({ awarded: false });
    });
  });

  describe('validateGoogleUser', () => {
    const googleUser = {
      email: 'user@example.com',
      name: 'User',
      avatarUrl: 'http://avatar',
      providerId: 'google-123',
      provider: 'google' as const,
    };

    it('rejects logging in via Google when the email was registered with a password (account takeover guard)', async () => {
      usersService.findByEmail.mockResolvedValue(activeUser); // provider: 'email'

      await expect(
        service.validateGoogleUser(googleUser),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.create).not.toHaveBeenCalled();
      expect(usersService.recordDailyLogin).not.toHaveBeenCalled();
    });

    it('returns the existing user when the account was already linked to Google', async () => {
      const googleLinkedUser = {
        ...activeUser,
        provider: 'google',
        providerId: 'google-123',
      };
      usersService.findByEmail.mockResolvedValue(googleLinkedUser);

      const result = await service.validateGoogleUser(googleUser);

      expect(result.user).toBe(googleLinkedUser);
      expect(usersService.create).not.toHaveBeenCalled();
      expect(usersService.recordDailyLogin).toHaveBeenCalledWith(
        googleLinkedUser.id,
      );
      expect(result.dailyReward).toEqual({ awarded: false });
    });

    it('allows Google login for a linked account even when `provider` still says "email" (gate must check providerId, not provider)', async () => {
      // Kết quả của flow link (P1 account-linking roadmap): user gốc đăng ký
      // bằng password (provider: 'email') rồi link Google sau — providerId
      // được set nhưng field `provider` KHÔNG bị đổi lại.
      const linkedButStillEmailProvider = {
        ...activeUser,
        provider: 'email',
        providerId: 'google-123',
      };
      usersService.findByEmail.mockResolvedValue(linkedButStillEmailProvider);

      const result = await service.validateGoogleUser(googleUser);

      expect(result.user).toBe(linkedButStillEmailProvider);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('creates a new google-provider user when no account exists for the email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: 'user-2', ...googleUser });

      const result = await service.validateGoogleUser(googleUser);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: googleUser.email,
          provider: 'google',
        }),
      );
      expect(usersService.recordDailyLogin).toHaveBeenCalledWith('user-2');
      expect(result.user).toEqual({ id: 'user-2', ...googleUser });
    });
  });

  describe('verifyPasswordAndIssueLinkTicket', () => {
    // ForbiddenException (403), KHÔNG phải UnauthorizedException (401) — xem
    // comment ở auth.service.ts#verifyPasswordAndIssueLinkTicket(). User gọi
    // route này luôn có access token hợp lệ; 401 ở đây sẽ bị interceptor axios
    // phía FE hiểu nhầm thành "token hết hạn" và tự ý refresh+retry.
    it('rejects when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyPasswordAndIssueLinkTicket('user-1', 'x'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a Google-only account (no password to verify against)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        password: null,
      });

      await expect(
        service.verifyPasswordAndIssueLinkTicket('user-1', 'x'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.verifyPasswordAndIssueLinkTicket('user-1', 'wrong'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('issues a short-lived link_google ticket on a correct password', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const ticket = await service.verifyPasswordAndIssueLinkTicket(
        'user-1',
        'correct',
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: activeUser.id, purpose: 'link_google' },
        { expiresIn: '5m' },
      );
      expect(ticket).toBe('signed-token');
    });
  });

  describe('linkGoogleAccount', () => {
    const googleProfile = {
      email: activeUser.email,
      name: 'User',
      avatarUrl: 'http://new-avatar',
      providerId: 'google-999',
      provider: 'google' as const,
    };

    it('rejects when the target user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // load user theo ticket.sub

      await expect(
        service.linkGoogleAccount('user-1', googleProfile),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when the Google account's email does not match the user's email", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(activeUser);

      await expect(
        service.linkGoogleAccount('user-1', {
          ...googleProfile,
          email: 'someone-else@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the Google account is already linked to a different user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(activeUser) // load user theo ticket.sub
        .mockResolvedValueOnce({
          id: 'other-user',
          providerId: googleProfile.providerId,
        }); // check providerId đã bị chiếm

      await expect(
        service.linkGoogleAccount('user-1', googleProfile),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('links successfully when email matches and providerId is free', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ ...activeUser, avatarUrl: null })
        .mockResolvedValueOnce(null); // providerId chưa ai chiếm
      prisma.user.update.mockResolvedValue({
        ...activeUser,
        providerId: googleProfile.providerId,
      });

      await service.linkGoogleAccount('user-1', googleProfile);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: activeUser.id },
        data: {
          providerId: googleProfile.providerId,
          avatarUrl: googleProfile.avatarUrl,
        },
      });
    });

    it('keeps the existing avatarUrl instead of overwriting it with the Google one', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({
          ...activeUser,
          avatarUrl: 'http://existing-avatar',
        })
        .mockResolvedValueOnce(null);
      prisma.user.update.mockResolvedValue(activeUser);

      await service.linkGoogleAccount('user-1', googleProfile);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            avatarUrl: 'http://existing-avatar',
          }),
        }),
      );
    });
  });

  describe('setPassword', () => {
    it('rejects when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.setPassword('user-1', 'NewPassword123'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('hashes and sets the password without touching providerId/provider', async () => {
      const googleOnlyUser = {
        ...activeUser,
        password: null,
        provider: 'google',
        providerId: 'google-123',
      };
      prisma.user.findUnique.mockResolvedValue(googleOnlyUser);
      prisma.user.update.mockResolvedValue(googleOnlyUser);

      await service.setPassword('user-1', 'NewPassword123');

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: googleOnlyUser.id },
        data: { password: 'hashed-token' },
      });
    });
  });

  describe('refreshTokens', () => {
    const jti = 'jti-1';
    const validPayload = { sub: activeUser.id, jti, type: 'refresh' };

    it('rejects a token whose payload type is not "refresh"', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: activeUser.id,
        jti,
        type: 'access',
      });

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the refresh token record was already revoked', async () => {
      jwtService.verifyAsync.mockResolvedValue(validPayload);
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.refreshToken.findUnique.mockResolvedValue({
        jti,
        userId: activeUser.id,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 10000),
        tokenHash: 'hashed-token',
      });

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the refresh token record has expired', async () => {
      jwtService.verifyAsync.mockResolvedValue(validPayload);
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.refreshToken.findUnique.mockResolvedValue({
        jti,
        userId: activeUser.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 10000),
        tokenHash: 'hashed-token',
      });

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the raw token does not match the stored hash', async () => {
      jwtService.verifyAsync.mockResolvedValue(validPayload);
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.refreshToken.findUnique.mockResolvedValue({
        jti,
        userId: activeUser.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 10000),
        tokenHash: 'hashed-token',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rotates the token on success: revokes the old one and creates a new one', async () => {
      jwtService.verifyAsync.mockResolvedValue(validPayload);
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.refreshToken.findUnique.mockResolvedValue({
        jti,
        userId: activeUser.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 10000),
        tokenHash: 'hashed-token',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.refreshTokens('token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { jti },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: activeUser.id }),
        }),
      );
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('revokeRefreshToken', () => {
    it('marks the token revoked when it was not revoked yet', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: activeUser.id,
        jti: 'jti-1',
        type: 'refresh',
      });
      prisma.refreshToken.findUnique.mockResolvedValue({
        jti: 'jti-1',
        revokedAt: null,
      });

      await service.revokeRefreshToken('token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { jti: 'jti-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('is a no-op when the token was already revoked', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: activeUser.id,
        jti: 'jti-1',
        type: 'refresh',
      });
      prisma.refreshToken.findUnique.mockResolvedValue({
        jti: 'jti-1',
        revokedAt: new Date(),
      });

      await service.revokeRefreshToken('token');

      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });
  });
});
