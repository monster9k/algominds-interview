# 🗺️ AlgoMinds — Production Readiness Roadmap

> Được tạo bởi audit toàn bộ mã nguồn ngày **2026-07-30**, dựa trên `CLAUDE.md`, `server/prisma/schema.prisma`, và khảo sát trực tiếp các luồng core (auth, sessions, chat/socket, ai, judge) cùng frontend (`client/src/features/*`).
> Đây là bản kế hoạch — **không có code tính năng nào được sinh ra** trong lượt tạo file này.

## Cách đọc file này
- `🔴 P0` — Khẩn cấp & cốt lõi: lỗ hổng bảo mật, race condition, tính đúng đắn dữ liệu, hoặc thiếu hụt chặn release.
- `🟡 P1` — Quan trọng: ảnh hưởng trải nghiệm/độ tin cậy nhưng không chặn release ngay lập tức.
- `🟢 P2` — Hoàn thiện & đánh bóng: cleanup, tối ưu, tiện ích dev.
- Mỗi task có ghi chú **vị trí code** liên quan để bắt tay vào làm ngay, không cần dò lại.
- Mục **"Đã xác minh — không còn là vấn đề"** ở cuối file liệt kê các mục từng bị flag (trong `proj.md` cũ hoặc giả định ban đầu) nhưng khảo sát lần này xác nhận đã được fix — để tránh làm lại việc đã xong.

---

## 🔴 P0 — Khẩn cấp & Cốt lõi

### Bảo mật & Xác thực
- [x] **Access token và refresh token dùng chung `JWT_SECRET`, `JwtStrategy` không phân biệt loại token**
  Refresh token (sống 7 ngày) có đủ `sub/email/role` như access token nên có thể dùng thẳng làm Bearer token cho mọi route `JwtAuthGuard`, bỏ qua cơ chế xoay vòng/hash refresh token.
  📍 `server/src/modules/auth/jwt.strategy.ts` (hàm `validate`), `server/src/modules/auth/auth.service.ts` (nơi ký token) — cần thêm claim `type: 'access' | 'refresh'` và kiểm tra trong strategy.

- [x] **`AuthService.validateGoogleUser` không kiểm tra provider gốc của tài khoản**
  Tài khoản đăng ký bằng email/password có thể bị đăng nhập qua Google với cùng email mà không có bước liên kết tường minh — rủi ro account takeover.
  📍 `server/src/modules/auth/auth.service.ts` (hàm `validateGoogleUser`, dòng ~107-131).

- [x] **DTO validation bị bỏ qua ở `POST /judge/submit`**
  Body dùng kiểu literal `{ sessionId, code, language }` thay vì class DTO, nên `ValidationPipe({whitelist, forbidNonWhitelisted})` toàn cục không có tác dụng — không giới hạn độ dài `code`, `language` lạ bị fallback âm thầm về `node`.
  📍 `server/src/modules/judge/judge.controller.ts` (dòng ~16-23), `server/src/modules/judge/services/piston.service.ts` (dòng ~182) — cần tạo `SubmitCodeDto` với `class-validator`.

### Tính đúng đắn dữ liệu
- [x] **Optimistic lock `Session.version` không atomic — mất tác dụng khi race condition**
  Flow hiện tại: `findUnique` → so `version` bằng tay → `update({ where: { id } })` (không đưa `version` vào mệnh đề `where`). Hai request cùng version gửi gần như đồng thời đều pass check rồi cùng ghi đè.
  📍 `server/src/modules/sessions/sessions.service.ts` (dòng ~124-153) — sửa thành `update({ where: { id, version } })` và bắt lỗi `P2025` (record not found) để trả lỗi conflict đúng nghĩa.

- [x] **Không giới hạn/khấu trừ AI credits dù model đã có sẵn field**
  `UserStats.credits` được khởi tạo `10` khi đăng ký nhưng không có nơi nào trong `ai.service.ts`/`ai.processor.ts`/`chat.gateway.ts` đọc hoặc trừ field này — mỗi tin nhắn `send_message` đều bắn job Gemini không giới hạn số lần/user.
  📍 `server/prisma/schema.prisma` (model `UserStats`), `server/src/modules/chat/chat.gateway.ts` (dòng ~166-171).

- [x] **Giới hạn `timeLimitMs`/`memoryLimitMb` của đề bài không được enforce khi chấm bài**
  `Problem` đã có sẵn field này nhưng payload gửi Piston không truyền `run_timeout`/`run_memory_limit` tương ứng — mọi bài đều chạy theo giới hạn mặc định của Piston, không theo đề.
  📍 `server/src/modules/judge/services/piston.service.ts` (dòng ~32-36).

### Test coverage cho luồng nhạy cảm
- [x] **Viết unit test cho `JudgeService`** (chấm điểm, so sánh test case, xử lý lỗi Piston) — hiện 0% coverage, không có safety net khi sửa logic chấm bài.
  📍 `server/src/modules/judge/judge.service.ts`.
- [x] **Viết unit test cho `AuthService`** (login, register, refresh token rotation, Google OAuth linking) — đặc biệt quan trọng vì đây là nơi vừa phát hiện 2 lỗ hổng ở trên.
  📍 `server/src/modules/auth/auth.service.ts`.
- [x] **Thêm script `test` cho `client/`** — hiện `client/package.json` chỉ có `dev/build/lint/preview`, chưa có Vitest/testing-library nào được cấu hình.

### Xử lý lỗi luồng WebSocket / AI / Judge
- [x] **Phân biệt và hiển thị đúng lỗi khi Gemini hoặc Piston fail/timeout**
  Hiện tại chỉ có toast lỗi chung chung ("Hệ thống chấm lỗi"), không phân biệt được nguyên nhân (Piston timeout vs Gemini fail vs network).
  📍 `client/src/features/interview/hooks/use-judge.ts`, `use-evaluation.ts`, `use-session.ts` (chưa có `onError` handler rõ ràng).
- [x] **Đồng bộ retry/backoff cho job `chat-job`** — hiện không có `attempts/backoff`, khác với job `evaluate-code` đã có `attempts: 3` + backoff. Lỗi giữa `processChat` sẽ làm mất tin nhắn AI vĩnh viễn, không có dead-letter queue để debug.
  📍 `server/src/modules/chat/chat.gateway.ts` (dòng ~166-170), `server/src/common/queue/queue.module.ts` (thiếu `defaultJobOptions` toàn cục).

### CI tối thiểu
- [x] **Thêm GitHub Actions workflow chạy lint + build (server & client) trên mỗi PR** — hiện không có `.github/workflows` nào, không có gì chặn merge code lỗi/không build được.

---

## 🟡 P1 — Quan trọng

### Backend hardening
- [x] **`ChatGateway` cấu hình CORS `origin: '*'`**, không khớp whitelist `FRONTEND_URL` mà REST đang dùng ở `main.ts`. Thu hẹp lại theo cùng whitelist.
  📍 `server/src/modules/chat/chat.gateway.ts` (dòng ~30-34).
- [x] **Rate-limit riêng cho WebSocket `send_message`** + giới hạn độ dài `content` trước khi lưu DB/gửi Gemini — hiện chỉ kiểm tra ownership session, không có spam-guard như REST (`ThrottlerGuard`).
  📍 `server/src/modules/chat/chat.gateway.ts` (dòng ~122-174).
- [x] **`PrismaService` đọc thẳng `process.env.DATABASE_URL`** thay vì qua `ConfigService` — chuẩn hoá lại để nhất quán với các service khác và dễ test/mocking.
- [x] **Rà soát `ThrottlerGuard` global (10 req/60s)** — có thể quá chặt khi áp dụng đồng loạt cho mọi endpoint; cân nhắc cấu hình riêng theo route nhạy cảm (login, submit) vs route đọc (problems list).

### Data model
- [x] **Thêm `@@index` cho `SessionEvent.sessionId`** — hiện chưa có index dù bảng này được query theo session khi audit lịch sử transition.
  📍 `server/prisma/schema.prisma` (model `SessionEvent`).
- [x] **Thêm index cho `Session.problemId`** (hiện chỉ có `@@index([userId, status])`) — cần cho truy vấn thống kê theo problem (acceptance rate, số lượt submit).
- [ ] **Xác nhận cascade delete (hard) và soft-delete (`deletedAt`) không xung đột** cho `User`/`Problem` — hai cơ chế xoá đang tồn tại song song trong schema, cần thống nhất flow nào được dùng thật trong service.

### Cấu hình & vận hành
- [ ] **Bổ sung biến còn thiếu vào `server/.env.example`**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` (bắt buộc — code dùng `getOrThrow`, app crash nếu thiếu khi khởi động), `NODE_ENV` (ảnh hưởng cờ `secure` của cookie).
- [ ] **Thêm giá trị mẫu/default cho từng biến trong `.env.example`** (cả server và client) — hiện để trống hoàn toàn, dev mới không biết điền format nào (vd `EXPIRES_IN`).
- [ ] **`docker-compose.yml`: thêm `healthcheck`** cho `postgres`, `redis`, `piston`; không hardcode `POSTGRES_PASSWORD: admin123`; cân nhắc bỏ `privileged: true` cho container `piston` ngoài môi trường dev.

### Frontend — dữ liệu & UX
- [ ] **Nối nốt dữ liệu thật cho `features/users/`**: `badges-card.tsx`, `recent-submissions-card.tsx`, `submission-heatmap.tsx` vẫn dùng mock data (`MOCK_BADGE`, `MOCK_RECENT_SUBMISSIONS`, `MOCK_HEATMAP_DAYS`) — cần model backend tương ứng (Badge, SubmissionActivity) trước khi wiring. Đã có comment `TODO: Requires backend schema` sẵn trong code, cần chính thức hoá thành task backend + frontend.
- [ ] **`profile-info-card.tsx` hardcode `Rank #1,364,526`** (giá trị tĩnh) — cần API ranking thật.
- [ ] **Thêm loading state riêng theo từng giai đoạn** trong interview room (đang chấm chiến lược Phase 1, đang chạy test case Phase 2) — hiện người dùng chỉ thấy toast sau khi xong, không có spinner khi đang chờ.
  📍 `client/src/features/interview/components/*` (ai-chat-tab, testcase-tab).
- [ ] **Re-emit `join_room` khi socket tự reconnect** — hiện `join_room` chỉ emit 1 lần trong effect, nếu socket rớt và Socket.io tự reconnect giữa phiên, client không tự join lại room.
  📍 `client/src/features/interview/hooks/use-interview-socket.ts`.
- [ ] **Thêm Global Error Boundary** cho React app — hiện `main.tsx` không có, một crash bất kỳ sẽ làm trắng trang production.
- [ ] **Tích hợp monitoring cơ bản (Sentry hoặc tương đương)** cho cả client và server — hiện chưa có bất kỳ error tracking nào ngoài `console.log`.
- [ ] **Dọn `console.log` rò rỉ dữ liệu phiên trong production** — `interview-room.tsx` (dòng ~255-256, log toàn bộ `SESSION DATA`/`submissionResult` mỗi render), `use-auth.ts` (log `LOGIN RESPONSE`), `lib/socket.ts` (log connect/disconnect).
- [ ] **Cập nhật `CLAUDE.md`** — dòng ghi "problem-filters.tsx renders filter UI but is not yet wired to the query" đã lỗi thời, thực tế đã wired đầy đủ qua `useProblems(filters)`.

---

## 🟢 P2 — Hoàn thiện & Đánh bóng

- [ ] **Thêm husky + lint-staged** — pre-commit hook chạy lint/format, hiện chưa có nên dễ commit code chưa format.
- [ ] **Viết `README.md` ở root** hướng dẫn setup từ đầu (docker-compose, `.env`, seed, chạy dev) — hiện `server/README.md`/`client/README.md` vẫn là boilerplate mặc định của NestJS/Vite, chưa customize.
- [ ] **Bật lại `staleTime`** trong `use-problems.ts` (hiện đang comment out) — mỗi lần chuyển tab đều refetch không cần thiết.
- [ ] **Dọn dead code**: `client/src/features/interview/components/problem-panel/mockData.ts` (xác nhận còn dùng không), nút "Undo" trong toast login hiện không có chức năng thật (`onClick: () => console.log("Undo")`).
- [ ] **Xử lý các TODO còn sót** trong `client/src/app/router.tsx` (dòng ~23, 84).
- [ ] **Rà soát dependency `dompurify`** trong `client/package.json` — không tìm thấy nơi sử dụng thực tế trong `client/src`, cân nhắc xoá nếu thật sự không cần hoặc áp dụng đúng chỗ nếu vẫn cần sanitize nội dung đề bài (`content` là HTML).
- [ ] **Animation & performance polish** cho interview room, dashboard — sau khi các mục P0/P1 đã ổn định.
- [ ] **Chuyển bước lint trong CI (`.github/workflows/ci.yml`) từ non-blocking sang blocking** — hiện để `continue-on-error: true` vì repo có ~180 lỗi `@typescript-eslint/no-unsafe-*`/`no-explicit-any` tồn đọng từ trước (server + client); dọn hết nợ này rồi mới bật gate cứng.

---

## ✅ Đã xác minh — không còn là vấn đề

Các mục dưới đây từng được flag (trong `proj.md` — audit kiến trúc cũ ngày 2026-07-06 — hoặc là giả định ban đầu), nhưng khảo sát lần này xác nhận **đã được fix**, không cần đưa vào backlog:

- **XSS qua `dangerouslySetInnerHTML`** (`proj.md` mục C-2, PR #1 `fix/xss`) — không còn `dangerouslySetInnerHTML` nào trong `client/src`.
- **`useSession` gọi POST bên trong `useQuery`** (`proj.md` mục H-3) — `use-session.ts` hiện chỉ dùng `useQuery` cho GET, không có POST lồng bên trong.
- **Vừa poll vừa WebSocket cho evaluation** (`proj.md` mục H-6) — không tìm thấy `refetchInterval`/polling nào trong `features/interview`, luồng evaluation chỉ chạy qua socket event `code_evaluation_complete`.
- **Auth state mất khi refresh trang** (`proj.md` mục H-7) — `client/src/app/provider.tsx` (`AuthHydrator`) đã gọi `POST /auth/refresh` khi app mount để hydrate lại `user`/`accessToken` từ refresh-token cookie.
- **`problem-filters.tsx` chưa wired vào query** (ghi chú cũ trong `CLAUDE.md`) — thực tế đã wired đầy đủ, chỉ cần cập nhật lại `CLAUDE.md` (đã liệt kê ở mục P1).
