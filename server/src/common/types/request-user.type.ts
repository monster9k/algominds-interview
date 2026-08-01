// Shape of `request.user` after JwtStrategy.validate() runs — see jwt.strategy.ts.
export interface RequestUser {
  userId: string;
  username: string;
  role: string;
}
