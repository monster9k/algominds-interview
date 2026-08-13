# 🗺️ AlgoMinds — Roadmap: Liên kết tài khoản Email ⇄ Google (account linking)

> Bản roadmap trước ("UI + API wiring cho Admin CRUD Store/Career/Quest/Discuss/Peer Interview") đã hoàn thành 100% P0→P4 — 5 commit (`5f669e6`, `cdecd96`, `cd5be07`, `704a25d`, `665bab7`), verify tsc/lint + QA Chrome cho từng phase. Xem lại nội dung ở các commit đó nếu cần tham chiếu.
>
> Bản này **thay thế hoàn toàn** — chủ đề khác hẳn (auth/bảo mật, không phải admin UI). Bối cảnh: nút "Connect Google" ở `SocialAccountsSection` hiện là **UI trang trí, không có `onClick`, không gọi API nào** — chưa từng có tính năng liên kết tài khoản. Người dùng đăng ký bằng email/password và người dùng đăng ký bằng Google hiện là 2 "thế giới" tách biệt hoàn toàn, không có đường nối.
>
> **Trạng thái: 🔵 CHỈ LÊN KẾ HOẠCH — chưa viết code.** Việc này đụng trực tiếp vào auth/bảo mật, đã thảo luận kỹ 2 chiều liên kết với user trước khi ghi vào đây — dừng lại để user review, chỉ code khi được yêu cầu rõ.

## Đã xác nhận với user trước khi lên kế hoạch
- **Phạm vi đợt này CHỈ làm chiều "liên kết" (link)** — KHÔNG làm "gỡ liên kết" (unlink Google / xoá mật khẩu). Unlink để đợt sau, vì cần thêm rule chặn "gỡ khiến tài khoản còn 0 phương thức đăng nhập" — phức tạp hơn, làm khi được yêu cầu rõ.
- **Bắt buộc xác thực lại (step-up) trước khi liên kết ở cả 2 chiều** — nhưng cơ chế xác thực lại ở 2 chiều KHÁC NHAU (xem giải thích dưới), không dùng chung 1 cách.
- Hành vi chặn hiện tại (đăng ký email trước → cố đăng nhập Google cùng email → bị chặn với message rõ ràng, redirect `/auth/login?error=google_account_conflict`, KHÔNG tạo tài khoản trùng/không merge ngầm) **giữ nguyên, không đổi** — chỉ đổi điều kiện gate từ so `provider` (field đơn, dễ sai khi 1 user có cả 2 phương thức) sang so `providerId` (đã link hay chưa).

## Vì sao 2 chiều không đối xứng — điểm mấu chốt của toàn bộ thiết kế

Schema hiện tại (`server/prisma/schema.prisma` model `User`) đã có sẵn 2 field **độc lập, đều nullable**: `password` và `providerId`. Đây là điều kiện đủ để 1 user có CẢ HAI phương thức đăng nhập cùng lúc — không cần thêm cột mới, chỉ cần sửa logic gate:
- `login()` (email/password, `auth.service.ts:93`) **chỉ check `user.password` có tồn tại** — không đụng `provider`. Nghĩa là: chiều Google-first thêm password xong, `login()` tự động hoạt động ngay, **không cần sửa gì thêm ở hàm này**.
- `validateGoogleUser()` (`auth.service.ts:113`) hiện check `user.provider !== 'google'` — **phải đổi** sang check `!user.providerId` (Google đã từng được link hay chưa), vì `provider` là field đơn/loại trừ lẫn nhau, không đại diện đúng cho trạng thái "có cả 2 phương thức".

### Chiều A — Email/password trước → Connect Google (re-auth = nhập lại mật khẩu)
1. User đang login bằng session email/password (có `password`, `providerId = null`).
2. Bấm "Connect Google" ở Settings → dialog yêu cầu nhập lại mật khẩu hiện tại.
3. `POST /auth/verify-password` (JwtAuthGuard, body `{password}`) — bcrypt compare với `user.password`. Đúng → sinh **"link ticket"**: 1 JWT ký riêng (KHÁC access/refresh token), payload `{sub: userId, purpose: 'link_google'}`, hết hạn 5 phút. Trả về ticket cho FE.
   - **Vì sao cần ticket thay vì chỉ dựa JWT session hiện có**: bước tiếp theo là **browser điều hướng cả trang** sang Google (`window.location.href = ...`), không phải `fetch()` — trình duyệt KHÔNG đính kèm được header `Authorization` khi điều hướng toàn trang. Route `GET /auth/google/link` vì vậy **không thể** bọc bằng `JwtAuthGuard` thông thường — ticket (truyền qua query string) là cách duy nhất mang được "bằng chứng đã xác thực" qua vòng redirect Google.
4. FE điều hướng `GET /auth/google/link?ticket=<ticket>` (route public, không `JwtAuthGuard`) → route xác minh chữ ký + hạn + `purpose` của ticket hợp lệ mới cho redirect tiếp sang Google, ticket được nhét vào tham số `state` của OAuth request (Google giữ nguyên `state` khi redirect callback về).
5. Google redirect về `GET /auth/google/callback?state=<ticket>&code=...` (route có sẵn) — controller đọc `req.query.state`: nếu là 1 link-ticket hợp lệ → gọi `authService.linkGoogleAccount()` thay vì `validateGoogleUser()`.
6. `linkGoogleAccount(userId, googleProfile)`:
   - Load user theo `userId` giải mã từ ticket (không phải theo email Google — tránh 1 kẻ tấn công tự tạo ticket giả cho email khác, dù ticket đã ký nên khó giả, đây là lớp phòng thủ kép).
   - **Bắt buộc `googleProfile.email === user.email` tuyệt đối** — khác thì từ chối, redirect `?error=google_email_mismatch` (không cho link Google account khác email vào tài khoản đang có).
   - Kiểm tra `providerId` đó **chưa** được user khác chiếm (unique constraint ở DB + check tường minh) — trùng thì từ chối, redirect `?error=google_already_linked`.
   - Update `user.providerId` (+ `avatarUrl` nếu user chưa có sẵn). **KHÔNG đụng `password`.**
   - Redirect `${FRONTEND_URL}/settings?linked=google` (khác hẳn đường login — user vốn đã đăng nhập, không cần cấp lại token).

### Chiều B — Google trước → Đặt mật khẩu (re-auth = xác thực lại qua Google, KHÔNG phải nhập mật khẩu vì chưa có)
1. User đang login bằng session Google (`password = null`, `providerId` đã set).
2. Bấm "Đặt mật khẩu" ở Settings → **không có mật khẩu cũ để nhập lại** (khác hẳn chiều A) → thay vào đó, điều hướng lại qua **đúng luồng đăng nhập Google có sẵn** (`GET /auth/google` → `GET /auth/google/callback` → `validateGoogleUser()` như bình thường, không cần route/logic mới) — việc đăng nhập lại thành công CHÍNH LÀ bước re-auth (chứng minh vẫn kiểm soát tài khoản Google đó), không phải chỉ dựa vào JWT session cũ (có thể đã tồn tại nhiều phút, rủi ro session bị đánh cắp).
3. Sau khi Google callback thành công, FE nhận **access token mới tinh** (vừa issue) → hiện dialog "Đặt mật khẩu" ngay.
4. `POST /auth/set-password` (JwtAuthGuard, body `{password}`) — **thêm điều kiện phụ**: decode JWT hiện tại, so `iat` (issued-at) phải nằm trong **≤ 2 phút gần nhất** — nếu access token đã cũ hơn (vd user quay lại trang Settings sau 10 phút mới bấm) → từ chối `401` "Vui lòng xác thực lại qua Google trước khi đặt mật khẩu", bắt họ lặp lại bước 2. Đây là "step-up" tương đương chiều A, chỉ khác cơ chế mang bằng chứng (JWT `iat` mới thay vì ticket riêng, vì ở đây không cần vượt qua vòng redirect Google nữa — request này là `fetch()` bình thường, giữ được header `Authorization`).
5. Backend hash password (bcrypt, cùng rule `MinLength(6)` như `CreateUserDto`), set `user.password`. **KHÔNG đụng `providerId`/`provider`.**
6. `login()` tự động hoạt động ngay cho user này từ sau bước 5 — không cần sửa gì thêm (đã giải thích ở trên).

---

## Kế hoạch theo thứ tự ưu tiên

### 🔴 P0 — Nền tảng: sửa gate + migration (bắt buộc làm trước, cả 2 chiều đều phụ thuộc) — ✅ ĐÃ XONG
- [x] Migration: giữ nguyên `@@index([provider, providerId])`, thêm `@@unique([providerId])`.
  📍 `server/prisma/schema.prisma`.
  ⚠️ `npx prisma migrate dev` vẫn đòi reset toàn bộ DB do drift đã ghi chú từ P0 Store cũ — **đã KHÔNG làm theo**, dùng `npx prisma db push` (đã verify trước không có `providerId` trùng nhau trong DB, nên constraint áp được an toàn, 0 data loss — xác nhận lại `SELECT COUNT(*) FROM users` = 13, không đổi).
- [x] `validateGoogleUser()`: đổi gate `user.provider !== 'google'` → `!user.providerId`.
  📍 `server/src/modules/auth/auth.service.ts`.
- [x] `usersService.findOne()`: thêm `hasPassword: !!password` vào response.
  📍 `server/src/modules/users/users.service.ts`.
- [x] **Verify**: `auth.service.spec.ts` — thêm 1 test case mới xác nhận đúng lỗ hổng đã tránh được ("Google login vẫn pass dù `provider` gốc còn là 'email', miễn `providerId` đã set" — test này sẽ FAIL nếu ai đó lỡ revert gate về check `provider`), cập nhật fixture `googleLinkedUser` thêm `providerId` (thiếu field này khiến test cũ sẽ fail dưới gate mới). `npm run test` (server) — 62/62 pass. `npm run build` + `npm run lint` sạch. Verify tay `GET /users/me` qua curl với JWT admin thật → `hasPassword: true` đúng.

### 🟡 P1 — Chiều A: Email/password → Connect Google
- [ ] `dto/verify-password.dto.ts`: `{ password: string }` (`@IsNotEmpty`).
  📍 `server/src/modules/auth/dto/verify-password.dto.ts`.
- [ ] `POST /auth/verify-password` (JwtAuthGuard) — bcrypt compare, sai → `401`. Đúng → ký link-ticket (JWT riêng, `purpose: 'link_google'`, exp 5 phút, secret CÓ THỂ dùng chung `JWT_SECRET` nhưng payload phải có `purpose` để không lẫn với access/refresh token nếu bị dùng sai chỗ).
  📍 `server/src/modules/auth/auth.controller.ts`, `auth.service.ts#issueLinkTicket()`.
- [ ] `GET /auth/google/link?ticket=` (public, verify ticket hợp lệ trước khi redirect) — set `state=ticket` khi khởi tạo OAuth request. Cần override `GoogleAuthGuard`/tự viết guard con để inject `state` động (Passport mặc định không cho set `state` linh hoạt qua decorator thường).
  📍 `server/src/modules/auth/google-auth.guard.ts` (hoặc guard mới `google-link-auth.guard.ts`), `auth.controller.ts`.
- [ ] `GET /auth/google/callback`: đọc `req.query.state` — nếu decode ra link-ticket hợp lệ (`purpose === 'link_google'`, chưa hết hạn) → gọi `authService.linkGoogleAccount(ticketUserId, googleProfile)` thay vì `validateGoogleUser()`; lỗi (email không khớp / providerId đã bị chiếm) → redirect `${FRONTEND_URL}/settings?error=<code>`; thành công → redirect `${FRONTEND_URL}/settings?linked=google` (KHÔNG issue token mới — user vốn đã có session hợp lệ).
  📍 `server/src/modules/auth/auth.controller.ts#googleAuthRedirect()`.
- [ ] `authService.linkGoogleAccount(userId, googleProfile)`: load user theo `userId` từ ticket, check email khớp tuyệt đối, check `providerId` chưa bị chiếm (bắt lỗi unique constraint P2002 từ DB làm lớp chặn cuối), update `providerId`(+`avatarUrl` nếu thiếu).
  📍 `server/src/modules/auth/auth.service.ts`.
- [ ] Frontend: `VerifyPasswordDialog` (Input password + submit → `useVerifyPassword()` → nhận ticket → `window.location.href = `${API_URL}/auth/google/link?ticket=${ticket}`); sửa `SocialAccountsSection` — nút "Connect" của Google mở dialog này (Github/Apple/LinkedIn giữ nguyên trạng thái decorative, ngoài phạm vi); Settings page đọc query param `linked`/`error` lúc mount để hiện toast kết quả (giống pattern `google-callback-page.tsx` đọc `searchParams`).
  📍 `client/src/features/settings/components/social-accounts-section.tsx`, `client/src/features/settings/components/verify-password-dialog.tsx` (mới), `client/src/features/auth/api/auth-api.ts` (thêm `verifyPassword()`), `client/src/features/settings/pages/settings-page.tsx`.
- [ ] i18n: thêm key `settings.social.*` (dialog title/field/error messages) cả 3 locale.
- [ ] **Verify**: `npm run test`/`build`/`lint` (server + client). QA tay end-to-end thật (KHÔNG mock) qua curl + trình duyệt thật với Google account thật của bạn: đăng ký email test → verify-password sai → 401 → đúng → nhận ticket → gọi `/auth/google/link` với ticket giả/hết hạn → bị từ chối → dùng ticket thật, hoàn tất OAuth thật với Google account có email KHÁC → bị chặn `google_email_mismatch` → thử lại với Google account đúng email → `providerId` được set → sau đó login lại bằng Google thành công. Dọn dữ liệu test sau khi xong.

### 🟢 P2 — Chiều B: Google-only → Đặt mật khẩu
- [ ] `dto/set-password.dto.ts`: `{ password: string }` (`@IsString @MinLength(6)`, đúng rule `CreateUserDto`).
  📍 `server/src/modules/auth/dto/set-password.dto.ts`.
- [ ] `POST /auth/set-password` (JwtAuthGuard) — decode token hiện tại (đã có sẵn trong `req.user` qua `JwtAuthGuard`, cần thêm `iat` vào `RequestUser` type nếu chưa có), check `iat` trong 2 phút gần nhất → quá hạn → `401` "Vui lòng xác thực lại qua Google". Hợp lệ → hash + set `user.password`.
  📍 `server/src/common/types/request-user.type.ts` (thêm `iat`), `server/src/modules/auth/jwt.strategy.ts` (truyền `iat` vào `RequestUser`), `auth.controller.ts`, `auth.service.ts`.
- [ ] Frontend: Settings hiện nút "Đặt mật khẩu" (chỉ hiện khi `!user.hasPassword`) → click → redirect thẳng `GET /auth/google` (dùng lại flow login Google có sẵn, KHÔNG cần route/param mới) → sau khi quay lại thành công (`google-callback-page.tsx` xử lý xong, có access token mới) → tự mở dialog "Đặt mật khẩu" (cần 1 cách đánh dấu "vừa quay lại để đặt mật khẩu", vd query param `?intent=set_password` giữ nguyên qua suốt vòng redirect Google — Google KHÔNG tự bảo toàn query param lạ trên `redirect_uri`, nên phải nhét vào `state` giống ticket ở P1, dù ở đây không cần ký/verify gì thêm vì không mang quyền — chỉ là cờ UI) → `SetPasswordDialog` gọi `POST /auth/set-password`, lỗi 401 do token cũ → hiện lại nút "Xác thực lại qua Google".
  📍 `client/src/features/settings/components/set-password-dialog.tsx` (mới), `client/src/features/auth/pages/google-callback-page.tsx` (đọc thêm `state`/`intent`), `client/src/features/settings/components/social-accounts-section.tsx` hoặc section riêng cho phần password.
- [ ] i18n: key `settings.password.*` cả 3 locale.
- [ ] **Verify**: `npm run test`/`build`/`lint`. QA tay thật: user Google-only bấm "Đặt mật khẩu" → redirect Google → quay lại → đặt password → login lại bằng email/password (KHÔNG qua Google) → thành công. Test riêng case token cũ (đợi >2 phút, hoặc giả lập bằng cách gọi thẳng `POST /auth/set-password` với JWT cũ qua curl) → đúng 401. Dọn dữ liệu test sau khi xong.

---

## File cần đụng khi thực thi (tổng hợp, không phải lượt này)
- Schema: `server/prisma/schema.prisma` (`@@unique([providerId])`).
- Backend: `auth.service.ts`, `auth.controller.ts`, `google-auth.guard.ts` (hoặc guard mới), `jwt.strategy.ts`, `request-user.type.ts`, `users.service.ts`, 2 DTO mới (`verify-password.dto.ts`, `set-password.dto.ts`).
- Frontend: `social-accounts-section.tsx`, `google-callback-page.tsx`, `settings-page.tsx`, `auth-api.ts`, 2 dialog mới, i18n 3 locale (`settings` namespace).
- **Không đụng**: chiều "gỡ liên kết" (unlink) — ngoài phạm vi đã xác nhận. Github/Apple/LinkedIn ở `SocialAccountsSection` — vẫn là UI trang trí, không nằm trong yêu cầu lần này.

## Việc cần làm ngay lượt này
Chỉ ghi kế hoạch trên vào `ROADMAP.md` — **không viết code**. Đây là tính năng đụng auth/bảo mật, cần user duyệt kỹ thiết kế 2 chiều trước khi thực thi. Chỉ code khi được yêu cầu rõ (vd "làm P0", "tiến hành roadmap").

## Verification (áp dụng khi thực thi, không phải lượt này)
- `npm run test` (server) — mở rộng `auth.service.spec.ts` cho gate mới + `linkGoogleAccount`/`set-password` (module nhạy cảm nhất trong toàn repo theo `CLAUDE.md`, cẩn thận gấp đôi bình thường).
- QA tay thật với Google OAuth thật (không mock được — Passport Google strategy cần code thật từ Google) — dùng đúng Google account cá nhân của bạn, dọn dữ liệu test khỏi DB sau mỗi phase.
- 1 task = 1 commit, tick `- [ ]` → `- [x]` ngay khi xong.
- Không tự ý `git push`/mở PR nếu chưa được yêu cầu rõ.
- P0 phải xong (đặc biệt migration + gate mới) trước khi đụng P1/P2 — 2 chiều đều phụ thuộc nền tảng này.
