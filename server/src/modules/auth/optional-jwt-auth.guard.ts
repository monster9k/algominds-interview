import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Ghi đè phương thức mặc định của Passport
  handleRequest(err: any, user: any, info: any) {
    // Nếu có lỗi hoặc token không hợp lệ, trả về null thay vì ném lỗi

    // Trả về user nếu token hợp lệ. Nếu không có token (Guest), trả về null.
    // KHÔNG throw lỗi 401 ở đây.
    return user || null;
  }
}
