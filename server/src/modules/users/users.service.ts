import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'; // Thư viện mã hóa
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable() //Vì @Injectable() đánh dấu UsersService là một provider để NestJS có thể tạo, quản lý và inject nó vào chỗ khác bằng Dependency Injection (DI).
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
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
    const { password: _, ...result } = newUser;

    return result;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        stats: true,
      },
    });
    if (!user) return null;

    // Loại bỏ password trước khi trả về
    const { password, ...result } = user;
    return result;
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
