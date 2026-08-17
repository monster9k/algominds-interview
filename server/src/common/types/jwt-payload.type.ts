// Shape of the decoded JWT payload — see AuthService.generateToken(), which signs these.
// `iat` (issued-at, unix seconds) không được sign() thủ công nhưng luôn có
// mặt runtime — jsonwebtoken tự thêm khi ký trừ khi truyền `noTimestamp`
// (không dùng ở đây). Khai báo tường minh để dùng làm "fresh session" check
// (vd set-password sau khi re-auth qua Google — xem auth.controller.ts#setPassword()).
export type JwtPayload =
  | { sub: string; email: string; role: string; type: 'access'; iat: number }
  | {
      sub: string;
      email: string;
      role: string;
      type: 'refresh';
      jti: string;
      iat: number;
    };
