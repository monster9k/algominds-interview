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
  // Chỉ có ở response POST /auth/login (email/password) — không có ở
  // /auth/refresh, kể cả khi refresh đó đứng sau 1 lần đăng nhập Google mới
  // (xem GoogleCallbackPage, đọc dailyReward qua query param thay vì đây).
  dailyReward?: { awarded: boolean; coins?: number };
}
