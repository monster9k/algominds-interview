// Payload của "link ticket" — JWT ngắn hạn (5 phút) cấp bởi
// AuthService#verifyPasswordAndIssueLinkTicket(), mang qua tham số `state`
// của vòng OAuth redirect tới Google (browser điều hướng cả trang nên không
// đính kèm được header Authorization) — xem auth.controller.ts#googleAuthRedirect().
export interface LinkGoogleTicketPayload {
  sub: string; // userId của tài khoản đang xin link
  purpose: 'link_google';
}
