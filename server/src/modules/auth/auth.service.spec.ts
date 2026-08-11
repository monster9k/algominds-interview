// jest's `expect.objectContaining` types as `any`, which trips
// no-unsafe-assignment on every nested matcher object below.
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcrypt');

interface PrismaMock {
  user: { findUnique: jest.Mock };
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
      user: { findUnique: jest.fn() },
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
      const googleLinkedUser = { ...activeUser, provider: 'google' };
      usersService.findByEmail.mockResolvedValue(googleLinkedUser);

      const result = await service.validateGoogleUser(googleUser);

      expect(result).toBe(googleLinkedUser);
      expect(usersService.create).not.toHaveBeenCalled();
      expect(usersService.recordDailyLogin).toHaveBeenCalledWith(
        googleLinkedUser.id,
      );
    });

    it('creates a new google-provider user when no account exists for the email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: 'user-2', ...googleUser });

      await service.validateGoogleUser(googleUser);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: googleUser.email,
          provider: 'google',
        }),
      );
      expect(usersService.recordDailyLogin).toHaveBeenCalledWith('user-2');
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
