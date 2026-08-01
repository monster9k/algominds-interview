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
- [x] **Xác nhận cascade delete (hard) và soft-delete (`deletedAt`) không xung đột** cho `User`/`Problem` — hai cơ chế xoá đang tồn tại song song trong schema, cần thống nhất flow nào được dùng thật trong service.
  **Kết luận audit**: không có endpoint xoá nào (hard hoặc soft) được implement — `deletedAt` chưa từng được ghi ở đâu, chỉ có 1 chỗ select ra mà không lọc theo nó (`problems.service.ts findOne`). Vì vậy chưa có xung đột thật, nhưng các query đọc (`findByEmail`, `users.findOne`, `problems.findAll/findOne`, `sessions.create/findOrCreateBySlug`, `auth.refreshTokens`) đều **không lọc `deletedAt: null`** — nếu sau này có ai set `deletedAt` (vd qua admin panel tương lai) thì user/problem đó vẫn đăng nhập/hiển thị/tạo session bình thường như chưa hề bị xoá. Đã sửa các query trên để lọc `deletedAt: null`, giữ nguyên `onDelete: Cascade` cho các bảng phụ thuộc 1:1 vào vòng đời cha (`RefreshToken`, `SessionEvent`, `Message`, `Submission`, `Evaluation`) vì đó là cơ chế đúng cho hard-delete thật sự khi nó được implement.

### Cấu hình & vận hành
- [x] **Bổ sung biến còn thiếu vào `server/.env.example`**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` (bắt buộc — code dùng `getOrThrow`, app crash nếu thiếu khi khởi động), `NODE_ENV` (ảnh hưởng cờ `secure` của cookie).
- [x] **Thêm giá trị mẫu/default cho từng biến trong `.env.example`** (cả server và client) — hiện để trống hoàn toàn, dev mới không biết điền format nào (vd `EXPIRES_IN`). `client/.env.example` đã có sẵn giá trị mẫu hợp lệ từ trước, chỉ `server/.env.example` cần bổ sung (dùng placeholder giả, không copy secret thật từ `.env`).
- [x] **`docker-compose.yml`: thêm `healthcheck`** cho `postgres`, `redis`, `piston`; không hardcode `POSTGRES_PASSWORD: admin123`; cân nhắc bỏ `privileged: true` cho container `piston` ngoài môi trường dev.
  Đã thêm healthcheck cho cả 3 service (đã test thực tế bằng `docker compose up -d`, cả 3 lên `healthy`); `POSTGRES_USER/PASSWORD/DB` giờ đọc từ biến môi trường với default giữ nguyên giá trị cũ (không phá vỡ setup hiện có). **Giữ nguyên `privileged: true`** — đây là yêu cầu bắt buộc để Piston tạo sandbox isolate/nsjail chấm code, tắt đi sẽ hỏng tính năng chấm bài; đã thêm comment giải thích + khuyến nghị tách Piston ra host riêng khi lên production thay vì chỉ dựa vào compose file này.

### Frontend — dữ liệu & UX
- [x] **Nối nốt dữ liệu thật cho `features/users/`**: `badges-card.tsx`, `recent-submissions-card.tsx`, `submission-heatmap.tsx` vẫn dùng mock data (`MOCK_BADGE`, `MOCK_RECENT_SUBMISSIONS`, `MOCK_HEATMAP_DAYS`) — cần model backend tương ứng (Badge, SubmissionActivity) trước khi wiring. Đã có comment `TODO: Requires backend schema` sẵn trong code, cần chính thức hoá thành task backend + frontend.
  `recent-submissions-card.tsx` và `submission-heatmap.tsx` hoá ra tính được 100% từ schema hiện có (`Submission`/`Session`/`Problem`) — không cần model mới. Thêm `GET /judge/submissions/recent` và `GET /judge/submissions/heatmap` (`judge.service.ts`), verify cả 2 query chạy đúng trên DB dev thật. Đã xoá `MOCK_RECENT_SUBMISSIONS`/`MOCK_HEATMAP_DAYS` (dead code sau khi wiring). **`badges-card.tsx` vẫn giữ mock** — đây thực sự cần model `Badge` mới + rule "earn badge" (quyết định sản phẩm, không phải data-wiring cơ học), để lại làm task riêng.
- [x] **`profile-info-card.tsx` hardcode `Rank #1,364,526`** (giá trị tĩnh) — cần API ranking thật.
  Không tạo bảng leaderboard riêng (chưa cần thiết ở quy mô hiện tại) — `GET /users/me` (`users.service.ts findOne`) giờ trả thêm `rank` tính bằng `count(userStats.totalSolved > current) + 1`. Đã verify query chạy đúng trên DB dev thật. Frontend hiển thị `N/A` nếu `rank` null (user chưa có `UserStats`).
- [x] **Thêm loading state riêng theo từng giai đoạn** trong interview room (đang chấm chiến lược Phase 1, đang chạy test case Phase 2) — hiện người dùng chỉ thấy toast sau khi xong, không có spinner khi đang chờ.
  📍 `client/src/features/interview/components/*` (ai-chat-tab, testcase-tab).
  Phase 2 (Submit) hoá ra **đã có sẵn** spinner + disabled state ở `interview-header.tsx` (`isSubmitting`) — không cần sửa. Gap thật sự là Phase 1: gửi tin chiến lược xong không có gì báo hiệu đang chờ Gemini trả lời. Đã thêm state `isAiThinking` trong `console-panel.tsx` (bật khi emit `send_message`, tắt khi nhận `receive_message` từ AI hoặc khi có `error`/`credits_exhausted`), hiển thị bubble "..." typing-indicator trong `ai-chat-tab.tsx` + disable ô nhập/nút gửi trong lúc chờ.
- [x] **Re-emit `join_room` khi socket tự reconnect** — hiện `join_room` chỉ emit 1 lần trong effect, nếu socket rớt và Socket.io tự reconnect giữa phiên, client không tự join lại room.
  📍 `client/src/features/interview/hooks/use-interview-socket.ts`.
- [x] **Thêm Global Error Boundary** cho React app — hiện `main.tsx` không có, một crash bất kỳ sẽ làm trắng trang production.
- [x] **Tích hợp monitoring cơ bản (Sentry hoặc tương đương)** cho cả client và server — hiện chưa có bất kỳ error tracking nào ngoài `console.log`.
  Scaffolded opt-in (không có `SENTRY_DSN`/`VITE_SENTRY_DSN` thì hoàn toàn no-op, đã boot-test server thật để xác nhận). Server: `src/instrument.ts` (`Sentry.init` trước mọi import khác) + `SentryModule`/`SentryGlobalFilter` trong `app.module.ts`. Client: `src/lib/monitoring.ts` (`initMonitoring()` gọi ở `main.tsx`), `ErrorBoundary.componentDidCatch` gọi `captureException`.
- [x] **Dọn `console.log` rò rỉ dữ liệu phiên trong production** — `interview-room.tsx` (dòng ~255-256, log toàn bộ `SESSION DATA`/`submissionResult` mỗi render), `use-auth.ts` (log `LOGIN RESPONSE`), `lib/socket.ts` (log connect/disconnect).
- [x] **Cập nhật `CLAUDE.md`** — dòng ghi "problem-filters.tsx renders filter UI but is not yet wired to the query" đã lỗi thời, thực tế đã wired đầy đủ qua `useProblems(filters)`.

---

## 🟢 P2 — Hoàn thiện & Đánh bóng

- [x] **Thêm husky + lint-staged** — pre-commit hook chạy lint/format, hiện chưa có nên dễ commit code chưa format.
  Root `package.json` mới (không phải npm workspace — `server/`/`client/` vẫn giữ nguyên `package.json`/`node_modules` riêng) chỉ chứa `husky` + `lint-staged` làm dev tooling. `server/` và `client/` có eslint config/plugin riêng nên không thể chạy `eslint` thẳng từ root với path mà lint-staged truyền vào (sai cwd → sai config resolution). Giải quyết bằng `lint-staged.config.js` gọi 2 wrapper script (`scripts/lint-staged-server.js`, `scripts/lint-staged-client.js`) quy đổi path về tương đối trong từng thư mục con rồi spawn eslint/prettier với đúng `cwd`. Quan trọng: chỉ lint **các file đang staged**, không lint toàn bộ `src/**` — nếu không, ~237 lỗi eslint tồn đọng (mục CI-gate bên dưới) sẽ chặn mọi commit đụng đến server/client, kể cả file không liên quan. Đã test cả 2 nhánh (server `.ts`, client `.tsx`) qua `npx lint-staged` thật, bao gồm cả case "prettier tự sửa về y hệt bản gốc → lint-staged đúng đắn chặn empty commit".
- [x] **Viết `README.md` ở root** hướng dẫn setup từ đầu (docker-compose, `.env`, seed, chạy dev) — hiện `server/README.md`/`client/README.md` vẫn là boilerplate mặc định của NestJS/Vite, chưa customize.
  Viết `README.md` ở root: infra → env (bảng biến từ `.env.example` thật, không bịa) → install/migrate/seed → dev commands, trỏ sang `CLAUDE.md` cho kiến trúc chi tiết. Thay luôn nội dung boilerplate mặc định của `server/README.md`/`client/README.md` bằng bản rút gọn trỏ ngược về root README, tránh 2 nơi phải maintain trùng lặp.
- [x] **Bật lại `staleTime`** trong `use-problems.ts` (hiện đang comment out) — mỗi lần chuyển tab đều refetch không cần thiết.
  `queryClient` gốc (`lib/query-client.ts`) đã có `defaultOptions.queries.staleTime = 5 * 60 * 1000` từ đầu, nên hành vi runtime không đổi — nhưng dòng comment ở `use-problems.ts` khiến người đọc tưởng caching đang tắt. Bỏ comment để khai báo tường minh ngay tại query, không phụ thuộc ngầm vào default global.
- [x] **Dọn dead code**: `client/src/features/interview/components/problem-panel/mockData.ts` (xác nhận còn dùng không), nút "Undo" trong toast login hiện không có chức năng thật (`onClick: () => console.log("Undo")`).
  Xác nhận `mockData.ts` không còn importer nào (grep toàn `client/src`) → xoá file. Nút "Undo" chỉ gọi `console.log`, không rollback được gì → xoá luôn action đó khỏi toast thay vì giả vờ có chức năng.
- [x] **Xử lý các TODO còn sót** trong `client/src/app/router.tsx` (dòng ~23, 84).
  Cả 2 TODO đều là scaffolding cũ cho 1 pattern route-grouping (`AuthRoutes`/`ProblemsRoutes`/`InterviewRoutes`) chưa từng được áp dụng — routes thực tế đã khai báo trực tiếp, riêng lẻ trong `createBrowserRouter([...])`. Xoá 2 block comment chết đó cùng 1 route landing-page mẫu bị comment-out ở giữa (dòng ~29-40) vì cùng loại "kế hoạch cũ không còn liên quan", không viết lại theo pattern đã bỏ.
- [x] **Rà soát dependency `dompurify`** trong `client/package.json` — không tìm thấy nơi sử dụng thực tế trong `client/src`, cân nhắc xoá nếu thật sự không cần hoặc áp dụng đúng chỗ nếu vẫn cần sanitize nội dung đề bài (`content` là HTML).
  `problem.content` (markdown, không phải raw HTML) chỉ được render qua `<ReactMarkdown remarkPlugins={[remarkGfm]}>` ở `description-tab.tsx` — không dùng `rehype-raw` nên không có đường nào cho raw HTML lọt qua, và không còn `dangerouslySetInnerHTML` nào trong `client/src` (đã xác nhận ở mục P1/"Đã xác minh"). Dependency thật sự không dùng ở đâu → gỡ khỏi `package.json`/lockfile qua `npm uninstall`.
- [x] **Animation & performance polish** cho interview room, dashboard — sau khi các mục P0/P1 đã ổn định.
  Khảo sát có chủ đích (Explore agent) thay vì đoán: soát loading state, re-render pattern, hover/transition coverage, computation mỗi render trong `features/interview` + `features/users` + `components/layout`. `features/users` đã ổn (mọi card query-backed đều có `Skeleton` fallback đúng). 6 điểm tìm được, tất cả mechanical/an toàn: (1) `submission-heatmap.tsx` nút "Current" thiếu `transition-colors`; (2) `interview-header.tsx` nút clear-search thiếu `transition-colors`; (3) `dashboard-layout.tsx` resize handle không có hover feedback, không nhất quán với interview room; (4) `ai-chat-tab.tsx` chat list dùng `key={idx}` dù đã có `msg.id` ổn định; (5) `CodeEditorPanel` không memo hoá dù mọi prop truyền vào đều ổn định — bọc `React.memo` để tránh reconcile lại khi các state không liên quan trong `InterviewRoom` đổi (submit/eval/refetch); (6) `AIChatTab` nhận `onSendMessage={() => {}}` — prop chết, không được gọi ở đâu (gửi tin nhắn thật đi qua `onSubmit`), xoá cùng lúc dọn `socket`/`sessionId`/`user` cũng không dùng tới trong component này. Bỏ qua: full-viewport spinner khi `isLoading` (cần thiết kế skeleton 3-panel riêng, không phải fix 1 dòng) và 2 chỗ tính toán trong `submission-heatmap.tsx`/`submission-result-chart.tsx` (component chỉ re-render khi data đổi, `useMemo` sẽ vô nghĩa).
- [x] **Chuyển bước lint trong CI (`.github/workflows/ci.yml`) từ non-blocking sang blocking** — hiện để `continue-on-error: true` vì repo có ~180 lỗi `@typescript-eslint/no-unsafe-*`/`no-explicit-any` tồn đọng từ trước (server + client); dọn hết nợ này rồi mới bật gate cứng.
  Dọn sạch toàn bộ: server 186 → 0, client 51 → 0 lỗi (7 warning còn lại không chặn CI). Server: phần lớn lỗi tập trung ở vài root cause — `req.user`/JWT payload không có type (thêm `RequestUser`/`JwtPayload`/`GoogleValidatedUser` + Express declaration merging), Piston API response và Gemini response đều `any` (thêm interface khớp đúng field code đã đọc, không suy đoán field mới). Phát hiện phụ: `auth/type/jwt-user.type.ts` có field `email` sai (thực tế field là `username`) — xoá, gộp vào `RequestUser` dùng chung. Client: phần lớn là `no-explicit-any`/`no-unused-vars` mechanical, cộng 5 lỗi `react-refresh/only-export-components` (tách export non-component sang file riêng, convention chuẩn shadcn/ui) và 5 lỗi React Compiler readiness rule (`set-state-in-effect`/`preserve-manual-memoization`) hạ xuống `warn` vì repo chưa chạy `babel-plugin-react-compiler` (đã xác nhận qua `vite.config.ts`) — sửa đúng nghĩa đòi hỏi viết lại state machine của interview room, rủi ro cao khi zero test coverage, cùng mức độ thận trọng CLAUDE.md yêu cầu cho `judge.service.ts`/`auth.service.ts`. Phát hiện phụ đáng chú ý: type `any` ở `console-panel/types.ts` từng che giấu 1 bug thật — field `timestamp` không tồn tại trên object `SubmissionResponse` thực tế (field đúng là `createdAt`), khiến dòng "submitted at ..." hiển thị "Invalid Date" sau khi nộp bài ACCEPTED; đã fix cùng lúc consolidate 2 type hệ thống song song. Toàn bộ đã verify bằng `tsc --noEmit`/`tsc -b`, `npm run test` (20 test server + 16 test client đều pass), `npm run build` cả 2 phía, và smoke-test thật trên browser (login/register render đúng, form validation hoạt động, không có console error). CI `continue-on-error: true` đã gỡ ở cả 2 job.

---

## ✅ Đã xác minh — không còn là vấn đề

Các mục dưới đây từng được flag (trong `proj.md` — audit kiến trúc cũ ngày 2026-07-06 — hoặc là giả định ban đầu), nhưng khảo sát lần này xác nhận **đã được fix**, không cần đưa vào backlog:

- **XSS qua `dangerouslySetInnerHTML`** (`proj.md` mục C-2, PR #1 `fix/xss`) — không còn `dangerouslySetInnerHTML` nào trong `client/src`.
- **`useSession` gọi POST bên trong `useQuery`** (`proj.md` mục H-3) — `use-session.ts` hiện chỉ dùng `useQuery` cho GET, không có POST lồng bên trong.
- **Vừa poll vừa WebSocket cho evaluation** (`proj.md` mục H-6) — không tìm thấy `refetchInterval`/polling nào trong `features/interview`, luồng evaluation chỉ chạy qua socket event `code_evaluation_complete`.
- **Auth state mất khi refresh trang** (`proj.md` mục H-7) — `client/src/app/provider.tsx` (`AuthHydrator`) đã gọi `POST /auth/refresh` khi app mount để hydrate lại `user`/`accessToken` từ refresh-token cookie.
- **`problem-filters.tsx` chưa wired vào query** (ghi chú cũ trong `CLAUDE.md`) — thực tế đã wired đầy đủ, chỉ cần cập nhật lại `CLAUDE.md` (đã liệt kê ở mục P1).
