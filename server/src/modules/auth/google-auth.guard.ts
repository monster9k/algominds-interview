import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Ép Google luôn hiện màn hình chọn tài khoản VÀ màn hình xác nhận quyền
// (consent) - "select_account" không tự động ép hiện lại consent nếu app đã
// từng được cấp quyền trước đó, nên cần cộng thêm "consent" vào cùng prompt.
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions() {
    return { prompt: 'select_account consent' };
  }
}
