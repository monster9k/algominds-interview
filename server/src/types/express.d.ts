import { RequestUser } from '../common/types/request-user.type';
import { GoogleValidatedUser } from '../common/types/google-validated-user.type';

// @types/passport declares `Express.Request.user?: Express.User`. Two
// different strategies populate req.user in this app depending on which
// guard ran: JwtStrategy sets a full RequestUser on every JWT-guarded route,
// GoogleStrategy sets a GoogleValidatedUser only transiently during the
// /auth/google/callback request (see auth.controller.ts). Neither shape is
// guaranteed on any given request, hence both halves are Partial — callers
// narrow with an explicit cast at the one route that needs the Google shape.
declare global {
  namespace Express {
    interface User extends Partial<RequestUser>, Partial<GoogleValidatedUser> {}
  }
}

export {};
