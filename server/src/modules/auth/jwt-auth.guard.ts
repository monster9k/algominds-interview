import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

//Đây là class kích hoạt chiến lược kiểm tra Token mà bạn đã viết hôm qua (JwtStrategy).
