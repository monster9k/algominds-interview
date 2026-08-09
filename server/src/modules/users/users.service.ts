import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'; // Thư viện mã hóa
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable() //Vì @Injectable() đánh dấu UsersService là một provider để NestJS có thể tạo, quản lý và inject nó vào chỗ khác bằng Dependency Injection (DI).
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    // Extended whereUnique: `email` vẫn là điều kiện unique, `deletedAt`
    // chỉ là filter thêm — user đã soft-delete không được tìm thấy qua
    // đường này (login/register đều dùng chung hàm này).
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const { email, name, password, provider, providerId, avatarUrl } =
      createUserDto;

    // 1. Check xem email tồn tại chưa
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng!');
    }

    // 2. Xử lý Password (Logic mới: Chỉ hash nếu có password)
    let hashedPassword: string | null = null;

    if (password) {
      // Trường hợp Đăng ký thường
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    // Trường hợp Google: password sẽ là null, hashedPassword cũng là null -> OK

    // 3. Lưu vào DB (Thêm các trường provider, avatarUrl)
    const newUser = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword, // Có thể là chuỗi hash hoặc null
        provider: provider || 'local', // Mặc định là email nếu không gửi lên
        providerId,
        avatarUrl,
        role: 'USER',
        stats: {
          create: {
            credits: 10,
            streakDays: 0,
          },
        },
      },
      include: {
        stats: true,
      },
    });

    // 4. Xóa password khỏi kết quả trả về
    const { password: _password, ...result } = newUser;

    return result;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        stats: true,
      },
    });
    if (!user) return null;

    // Loại bỏ password trước khi trả về
    const { password, ...result } = user;

    // Rank theo totalSolved — không có bảng leaderboard riêng nên tính trực
    // tiếp: rank = số user có totalSolved cao hơn + 1.
    let rank: number | null = null;
    if (user.stats) {
      const higherRankedCount = await this.prisma.userStats.count({
        where: { totalSolved: { gt: user.stats.totalSolved } },
      });
      rank = higherRankedCount + 1;
    }

    return { ...result, rank };
  }

  // Confidence Calibration Score — so sánh confidenceSignal (giọng điệu lúc
  // được approve) với việc session đó có submission ACCEPTED hay không, để
  // phát hiện lệch pha "tự tin thái quá nhưng sai" / "đúng nhưng thiếu tự tin".
  // Chỉ tính session đã có confidenceSignal (được ghi từ ai.processor.ts khi
  // approve — session cũ trước bản cập nhật này sẽ có giá trị null, bị loại
  // khỏi thống kê thay vì tính sai).
  async getConfidenceCalibration(userId: string) {
    const CONFIDENCE_SIGNALS = ['hedging', 'neutral', 'assertive'] as const;

    const sessions = await this.prisma.session.findMany({
      where: { userId, confidenceSignal: { not: null } },
      select: {
        confidenceSignal: true,
        submissions: {
          where: { status: 'ACCEPTED' },
          select: { id: true },
          take: 1,
        },
      },
    });

    const isCorrect = (s: (typeof sessions)[number]) =>
      s.submissions.length > 0;

    const bySignal = CONFIDENCE_SIGNALS.map((signal) => {
      const matching = sessions.filter((s) => s.confidenceSignal === signal);
      return {
        signal,
        total: matching.length,
        correct: matching.filter(isCorrect).length,
      };
    });

    return {
      totalRated: sessions.length,
      bySignal,
      // "assertive" nhưng cuối cùng không có submission ACCEPTED nào.
      overconfidentCount: sessions.filter(
        (s) => s.confidenceSignal === 'assertive' && !isCorrect(s),
      ).length,
      // "hedging" nhưng thực ra vẫn giải đúng.
      underconfidentCount: sessions.filter(
        (s) => s.confidenceSignal === 'hedging' && isCorrect(s),
      ).length,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
      },
    });

    const { password, ...result } = updatedUser;
    return result;
  }
}
