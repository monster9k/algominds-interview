# 🗺️ AlgoMinds — Roadmap: Liên kết tài khoản Email ⇄ Google (account linking)

> Bản roadmap trước ("UI + API wiring cho Admin CRUD Store/Career/Quest/Discuss/Peer Interview") đã hoàn thành 100% P0→P4 — 5 commit (`5f669e6`, `cdecd96`, `cd5be07`, `704a25d`, `665bab7`), verify tsc/lint + QA Chrome cho từng phase. Xem lại nội dung ở các commit đó nếu cần tham chiếu.
>
> Bản này **thay thế hoàn toàn** — chủ đề khác hẳn (auth/bảo mật, không phải admin UI). Bối cảnh: nút "Connect Google" ở `SocialAccountsSection` hiện là **UI trang trí, không có `onClick`, không gọi API nào** — chưa từng có tính năng liên kết tài khoản. Người dùng đăng ký bằng email/password và người dùng đăng ký bằng Google hiện là 2 "thế giới" tách biệt hoàn toàn, không có đường nối.
>
> **Trạng thái: ✅ 100% HOÀN THÀNH (P0→P2)** — cả 2 chiều liên kết đã hoạt động end-to-end, kèm 2 lỗ hổng bảo mật thật (401-vs-403 tương tác với interceptor axios) được phát hiện và sửa ngay trong lúc QA/code, không phải chỉ lúc lên kế hoạch. **1 lưu ý còn treo**: chiều A (Connect Google) đã verify tới đúng màn hình Google OAuth thật (redirect_uri/state chính xác) nhưng chưa hoàn tất round-trip thật 100% vì cần nhập thông tin đăng nhập Google thật — nếu bạn muốn, có thể tự thử qua Settings (user test `p1_link_test@algominds.dev` / mật khẩu mới `NewSecurePass123` vẫn còn trong DB) để xác nhận `linkGoogleAccount()` chạy đúng trên round-trip thật; logic đã unit-test đầy đủ nên độ tin cậy cao.

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

### 🟡 P1 — Chiều A: Email/password → Connect Google — ✅ ĐÃ XONG (backend + FE đầy đủ, 1 bước cuối cần bạn tự verify)
- [x] `dto/verify-password.dto.ts`: `{ password: string }` (`@IsNotEmpty`).
  📍 `server/src/modules/auth/dto/verify-password.dto.ts`.
- [x] `POST /auth/verify-password` (JwtAuthGuard) — bcrypt compare. Đúng → ký link-ticket (JWT riêng, `purpose: 'link_google'`, exp 5 phút).
  📍 `server/src/modules/auth/auth.controller.ts`, `auth.service.ts#verifyPasswordAndIssueLinkTicket()`.
  ⚠️ **Phát hiện quan trọng lúc QA, đã sửa**: dùng `403 ForbiddenException` cho "sai mật khẩu"/"chưa có mật khẩu", **KHÔNG** dùng `401 UnauthorizedException` như định ban đầu — interceptor axios phía FE (`client/src/lib/axios.ts`) coi MỌI lỗi 401 (trừ vài route auth cố định) là "access token hết hạn", tự động gọi `/auth/refresh` rồi retry request gốc. User gọi route này LUÔN có access token hợp lệ (đã qua `JwtAuthGuard`) — nếu trả 401, request sẽ bị hiểu nhầm và trải qua 1 vòng refresh+retry vô ích trước khi lỗi thật mới lên tới UI. 403 = "đã xác thực nhưng không đủ quyền cho hành động cụ thể này" — đúng ngữ nghĩa hơn và né được interceptor đó hoàn toàn.
- [x] `GET /auth/google/link?ticket=` (public) — `GoogleAuthGuard` được sửa để đọc `?ticket=`, verify hợp lệ (`purpose === 'link_google'`) trước khi cho redirect, gắn `ticket` làm `state` của OAuth request (Google echo lại y nguyên ở callback, không cần lưu server-side).
  📍 `server/src/modules/auth/google-auth.guard.ts`, `auth.controller.ts#googleAuthLink()`.
- [x] `GET /auth/google/callback`: đọc `req.query.state` — có state hợp lệ → gọi `authService.linkGoogleAccount()` thay vì `validateGoogleUser()`; lỗi → redirect `${FRONTEND_URL}/settings?error=<code>` (`invalid_ticket`/`google_already_linked`/`google_email_mismatch`); thành công → redirect `${FRONTEND_URL}/settings?linked=google` (không issue token mới, user vốn đã có session).
  📍 `server/src/modules/auth/auth.controller.ts#googleAuthRedirect()`.
- [x] `authService.linkGoogleAccount(userId, googleProfile)`: load user theo `userId` từ ticket, check email khớp tuyệt đối, check `providerId` chưa bị chiếm, update `providerId` (+`avatarUrl` nếu user chưa có sẵn — giữ avatar cũ nếu đã có, không ghi đè).
  📍 `server/src/modules/auth/auth.service.ts`.
- [x] Frontend: `VerifyPasswordDialog` (mới) + sửa `SocialAccountsSection` (Google row đọc `providerId` từ `useUserProfile()` để hiện "Connected" hay nút "Connect"; Github/Apple/LinkedIn giữ nguyên decorative) + `SettingsPage` đọc query param `linked`/`error` lúc mount để toast kết quả + invalidate cache profile.
  📍 `client/src/features/settings/components/verify-password-dialog.tsx`, `social-accounts-section.tsx`, `client/src/features/settings/pages/settings-page.tsx`, `client/src/features/auth/api/auth-api.ts` (`verifyPassword`, `linkGoogle`), `client/src/features/users/types/index.ts` (thêm `hasPassword`, `providerId` vào `UserProfileResponse`).
- [x] i18n: `settings.social.*` (dialog + toast messages) cả 3 locale — đồng thời fix nhỏ: description cũ ghi "đăng nhập vào LeetCode" (copy-paste từ template cũ, sai brand) → đổi thành "AlgoMinds".
- [x] **Phát hiện + fix thứ 2 lúc QA**: mutation `verifyPassword` bị treo vô thời hạn ở trạng thái "Verifying..." khi lỗi — nguyên nhân: global `mutations: {retry: 1}` (`lib/query-client.ts`) khiến mọi mutation thất bại tự retry 1 lần, và TanStack Query tạm dừng (`pause()`) việc retry khi tab mất focus (`focusManager`), chỉ tiếp tục khi tab được focus lại. Fix đúng: thêm `retry: false` riêng cho mutation này — retry vốn vô nghĩa với lỗi "sai mật khẩu" (lỗi vĩnh viễn, không phải lỗi mạng thoáng qua), nên tắt hẳn thay vì chỉ né vấn đề focus.
  📍 `client/src/features/settings/components/verify-password-dialog.tsx`.
- [x] **Verify**: `npm run test` (server, 71/71 pass, thêm 5 test case cho `verifyPasswordAndIssueLinkTicket` + `linkGoogleAccount`) + `build`/`lint` (server + client) sạch. QA tay qua Chrome với user test thật (`p1_link_test@algominds.dev`): verify-password sai → 403 → toast lỗi hiện ngay (sau khi fix retry) → đúng → nhận ticket → redirect `GET /auth/google/link` → tới đúng màn hình đăng nhập Google thật, `redirect_uri`/`state` trong URL chính xác. **Dừng lại tại đây** — không tự nhập thông tin đăng nhập Google (yêu cầu bảo mật), cần bạn tự hoàn tất bước cuối (chọn Google account, xác nhận consent) để verify trọn vẹn `linkGoogleAccount()` chạy đúng trên DB thật. Logic `linkGoogleAccount()` đã được unit-test đầy đủ (5 case: user không tồn tại, email không khớp, providerId đã bị chiếm, link thành công, giữ nguyên avatar cũ) nên độ tin cậy cao dù chưa chạy round-trip Google thật 100%. User test `p1_link_test@algominds.dev` / `P1LinkTest@12345` vẫn còn trong DB (chưa dọn) để bạn tự test nếu muốn — dọn sau khi bạn xác nhận xong.

### 🟢 P2 — Chiều B: Google-only → Đặt mật khẩu — ✅ ĐÃ XONG
- [x] `dto/set-password.dto.ts`: `{ password: string }` (`@IsString @MinLength(6)`, đúng rule `CreateUserDto`).
  📍 `server/src/modules/auth/dto/set-password.dto.ts`.
- [x] `POST /auth/set-password` (JwtAuthGuard) — thêm `iat` vào `JwtPayload`/`RequestUser` (`JwtStrategy.validate()` truyền qua), check `iat` trong 2 phút gần nhất → quá hạn → hash + set `user.password`.
  📍 `server/src/common/types/{jwt-payload,request-user}.type.ts`, `server/src/modules/auth/jwt.strategy.ts`, `auth.controller.ts#setPassword()`, `auth.service.ts#setPassword()`.
  ⚠️ **Phát hiện bảo mật nghiêm trọng lúc code, đã tự sửa trước khi test**: suýt dùng `401 UnauthorizedException` cho lỗi "token cũ" — giống hệt bẫy đã gặp ở P1 nhưng **nguy hiểm hơn nhiều**: nếu trả 401, interceptor axios FE sẽ tự động gọi `/auth/refresh` rồi RETRY request `set-password` gốc với access token MỚI — token mới có `iat` vừa cấp (luôn "fresh"), khiến check bên dưới **luôn pass** dù user chưa hề đăng nhập lại qua Google thật. Điều này vô hiệu hoá hoàn toàn mục đích của freshness check (bất kỳ ai có 1 access token cũ hợp lệ nào, kể cả bị lộ, cũng tự "refresh" ra được quyền set password mà không cần re-auth). Đổi sang `403 ForbiddenException` — không kích hoạt interceptor refresh-retry.
- [x] Frontend: Settings hiện nút "Set a password" (chỉ hiện khi `!hasPassword`, tự ẩn/hiện theo cache profile) → click → đánh dấu ý định qua `sessionStorage` (không phải `state` OAuth — chỉ là gợi ý UI thuần, không mang quyền nên không cần ký) → redirect `GET /auth/google` (dùng lại route login có sẵn, không cần route/param mới) → `google-callback-page.tsx` đọc flag sau khi refresh token thành công → điều hướng `/settings?setPassword=1` thay vì `/dashboard` → `PasswordSection` tự đọc query param, tự mở `SetPasswordDialog`, tự dọn URL. Lỗi 403 (token cũ) → dialog chuyển sang trạng thái hiện nút "Xác thực lại qua Google" (gọi lại đúng bước re-auth).
  📍 `client/src/features/settings/components/set-password-dialog.tsx`, `password-section.tsx` (2 file mới), `client/src/features/auth/pages/google-callback-page.tsx`, `client/src/features/auth/api/auth-api.ts` (`reauthGoogleForSetPassword`, `setPassword`), `client/src/features/settings/pages/settings-page.tsx`.
- [x] i18n: `settings.password.*` cả 3 locale.
- [x] **Verify**: `npm run test` (server, 73/73, thêm 2 test case cho `setPassword()`) + `build`/`lint` (server+client) sạch. Verify tay qua curl với kỹ thuật tự ký JWT test (dùng đúng `JWT_SECRET` của server, kiểm soát chính xác `iat`): user Google-only giả lập (insert thẳng DB, `password: null, providerId` giả) → token `iat` 5 phút trước → `403` đúng → token `iat` vừa cấp → `200`, đặt mật khẩu thành công → login lại bằng password mới → `201` thành công, `providerId` vẫn giữ nguyên (user có cả 2 phương thức). QA tay qua Chrome với session thật đang đăng nhập (set `password=NULL` thẳng trên DB để giả lập tức thời trạng thái Google-only mà không cần vòng OAuth thật): `PasswordSection` tự hiện đúng, Google "Connect" tự disable đúng → mở dialog → test mismatch confirm password → đúng lỗi inline → sửa khớp → submit → toast "Password set successfully", `PasswordSection` tự biến mất, Google "Connect" enable lại → verify DB + login lại bằng password mới thành công. Không lỗi console. Dữ liệu test đã dọn sau khi xong.

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
