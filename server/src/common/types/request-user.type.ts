// Shape of `request.user` after JwtStrategy.validate() runs — see jwt.strategy.ts.
export interface RequestUser {
  userId: string;
  username: string;
  role: string;
  // Unix seconds access token được ký — dùng để check "session vừa mới tạo"
  // (vd set-password chỉ cho phép ngay sau khi vừa re-auth qua Google, xem
  // auth.controller.ts#setPassword()).
  iat: number;
}
