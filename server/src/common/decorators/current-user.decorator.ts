import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user; // Trả về user mà JwtStrategy đã validate xong
  },
);
//Tại sao cần cái này? Khi Guard kiểm tra xong, nó sẽ nhét thông tin user vào request. Thay vì mỗi lần dùng phải gõ req.user, ta tạo ra @CurrentUser() để code nhìn chuyên nghiệp hơn.

// Ví dụ sử dụng chuẩn nhất
// 1. Controller
// import { Controller, Get, UseGuards } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { CurrentUser } from '../auth/current-user.decorator';

// @UseGuards(JwtAuthGuard)
// @Controller('users')
// export class UsersController {

//   @Get('me')
//   getMe(@CurrentUser() user: any) { <-----------------------
//     return user;
//   }
// }

// 📌 Khi client gọi:

// GET /users/me
// Authorization: Bearer <jwt>

// ➡️ JwtStrategy validate token
// ➡️ gán user vào request.user
// ➡️ @CurrentUser() lấy ra
// ➡️ user được truyền thẳng vào getMe()

// 2. So sánh với cách không dùng decorator
// @Get('me')
// getMe(@Req() req) {
//   return req.user;
// }
