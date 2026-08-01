// Shape passed to `done()` in GoogleStrategy.validate() — becomes `req.user`
// only for the duration of the /auth/google/callback request, before a real
// JWT-backed RequestUser exists. See auth/strategies/google.strategy.ts.
export interface GoogleValidatedUser {
  email: string;
  name: string;
  avatarUrl: string;
  providerId: string;
  provider: 'google';
}
