// Shape of the decoded JWT payload — see AuthService.generateToken(), which signs these.
export type JwtPayload =
  | { sub: string; email: string; role: string; type: 'access' }
  | { sub: string; email: string; role: string; type: 'refresh'; jti: string };
