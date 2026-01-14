import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'; // Thư viện mã hóa

@Injectable() //Vì @Injectable() đánh dấu UsersService là một provider để NestJS có thể tạo, quản lý và inject nó vào chỗ khác bằng Dependency Injection (DI).
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmai(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async Create(createUserDto: CreateUserDto) {
    const { email, name, password } = createUserDto;

    // check xem email tồn tại chưa
    const existingUser = await this.findByEmai(email);

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng!');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const { password: _, ...result } = newUser; // xoa thang password khoi kq tra ve chi luu vao db thoi;

    return result;
  }
}
