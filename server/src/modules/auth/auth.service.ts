import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { GoogleValidatedUser } from '../../common/types/google-validated-user.type';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
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
    const refreshJti = randomUUID();
    const accessPayload = { sub: userId, email, role, type: 'access' };
    const refreshPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
      jti: refreshJti,
    };

    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, { expiresIn: '15m' }),
      this.jwtService.signAsync(refreshPayload, { expiresIn: '7d' }),
    ]);

    return {
      access_token: accessToken,
      refreshToken,
      refreshTokenJti: refreshJti,
      refreshTokenExpiresAt: refreshExpiresAt,
      user: { userId, email, role }, // Trả thêm info để Frontend dùng
    };
  }

  private async hashRefreshToken(token: string) {
    // Hash refresh token để không lưu raw token trong DB
    return bcrypt.hash(token, 10);
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    refreshTokenJti: string,
    refreshTokenExpiresAt: Date,
  ) {
    const tokenHash = await this.hashRefreshToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        jti: refreshTokenJti,
        tokenHash,
        expiresAt: refreshTokenExpiresAt,
      },
    });
  }

  async issueTokensForUser(user: { id: string; email: string; role: string }) {
    // Tạo token và lưu refresh token hash cho user này
    const tokens = await this.generateToken(user.id, user.email, user.role);

    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenJti,
      tokens.refreshTokenExpiresAt,
    );

    return tokens;
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

    // Pass đúng -> ghi nhận xu điểm danh hôm nay (no-op nếu đã claim), gắn
    // kết quả vào response để FE hiện toast "+1 xu" khi awarded, rồi tạo
    // token và lưu refresh token hash
    const dailyReward = await this.usersService.recordDailyLogin(user.id);
    const tokens = await this.issueTokensForUser(user);
    return { ...tokens, dailyReward };
  }

  async validateGoogleUser(googleUser: GoogleValidatedUser) {
    const { email, name, avatarUrl, providerId } = googleUser;

    // A. Kiểm tra user đã tồn tại chưa?
    const user = await this.usersService.findByEmail(email);

    if (user) {
      // Chặn account takeover: 1 email đã đăng ký bằng email/password (provider
      // "email") không được phép đăng nhập thẳng qua Google mà không có bước
      // liên kết tường minh trước.
      if (user.provider !== 'google') {
        throw new UnauthorizedException(
          'Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email/mật khẩu.',
        );
      }

      // Đã liên kết Google từ trước -> ghi nhận xu điểm danh hôm nay rồi trả
      // về (controller redirect flow đọc dailyReward để quyết định query
      // param cho FE hiện toast, sau đó issueTokensForUser ngay sau đó)
      const dailyReward = await this.usersService.recordDailyLogin(user.id);
      return { user, dailyReward };
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

    // Lần đăng nhập đầu tiên trong ngày cũng tính là điểm danh.
    const dailyReward = await this.usersService.recordDailyLogin(newUser.id);

    return { user: newUser, dailyReward };
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(
      refreshToken,
      {
        secret: process.env.JWT_SECRET,
      },
    );

    if (payload?.type !== 'refresh' || !payload?.jti) {
      throw new UnauthorizedException('Refresh Token không hợp lệ');
    }

    // 1) Xác thực user tồn tại (và chưa bị soft-delete)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    // 2) Lấy bản ghi refresh token theo jti để kiểm tra trạng thái
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });

    if (!tokenRecord || tokenRecord.userId !== user.id) {
      throw new UnauthorizedException('Refresh Token không tồn tại');
    }

    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh Token đã bị thu hồi');
    }

    if (tokenRecord.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh Token đã hết hạn');
    }

    // 3) So khớp raw refresh token với hash trong DB
    const isMatch = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh Token không khớp');
    }

    // 4) Rotate: tạo refresh token mới và revoke token cũ
    const newTokens = await this.generateToken(user.id, user.email, user.role);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { jti: tokenRecord.jti },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          jti: newTokens.refreshTokenJti,
          tokenHash: await this.hashRefreshToken(newTokens.refreshToken),
          expiresAt: newTokens.refreshTokenExpiresAt,
        },
      }),
    ]);

    return newTokens;
  }

  async revokeRefreshToken(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(
      refreshToken,
      {
        secret: process.env.JWT_SECRET,
      },
    );

    if (payload?.type !== 'refresh' || !payload?.jti) {
      throw new UnauthorizedException('Refresh Token không hợp lệ');
    }

    // Dùng jti để định danh chính xác token cần revoke
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh Token không tồn tại');
    }

    if (!tokenRecord.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { jti: tokenRecord.jti },
        data: { revokedAt: new Date() },
      });
    }
  }
}
