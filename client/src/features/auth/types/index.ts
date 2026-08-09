export interface RegisterCredentials {
  email: string;
  name: string;
  password?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Backend luôn trả { userId, email, role } (xem auth.service.ts#generateToken)
// — KHÔNG có field "id"/"name"/"avatarUrl" trong response login/register/refresh
// thực tế, dù trước đây type khai báo "id". "name"/"avatarUrl" chỉ có ở
// GET /users/me, không có ở payload đăng nhập.
export interface User {
  userId: string;
  email: string;
  role: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
