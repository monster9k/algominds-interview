# 🗺️ AlgoMinds — Roadmap: Redesign UI (Admin Dashboard + Unified Icon-Sidebar Shell)

> Bản roadmap trước (Admin Dashboard nền tảng — phân quyền, layout admin cũ, data table CRUD, RBAC MODERATOR, audit log) đã hoàn thành 100% P0/P1/P2 — xem lịch sử git (commit cuối chỉnh sửa file này: `0e21c685416b77aa7d21b594202ffdc042a03ad`) nếu cần tham chiếu lại nội dung cũ.
> Bản này thay thế nó. Mục tiêu: redesign toàn bộ UI theo ảnh tham chiếu (Pivora CRM dashboard) — hợp nhất layout admin/user thành 1 shared shell (icon-sidebar + top bar tối giản), chuyển profile vào sidebar, rebuild Admin Dashboard với KPI card + biểu đồ. Không đụng logic nghiệp vụ (`sessions.service.ts`/`judge.service.ts`/`auth.service.ts`, `Session.version`) — thay đổi chỉ ở layer UI + aggregate query read-only mới trong `admin.service.ts`.
>
> Bản kế hoạch đầy đủ (bối cảnh, quyết định đã chốt với user, phân tích) nằm ở plan file phiên làm việc — tóm tắt lại các quyết định quan trọng ở phần "Khảo sát" bên dưới.

## Cách đọc file này
- `🔴 P0` — Ưu tiên cao nhất theo đúng yêu cầu user ("trước tiên... trang admin dashboard trước"): Shared App Shell (`IconSidebar`+`TopBar`+`AppShell`, dùng chung admin/user), áp dụng cho `AdminLayout`, rebuild `AdminDashboardPage` với KPI card + chart (cần mở rộng backend `admin.service.ts`).
- `🟡 P1` — Áp dụng cùng shell đã build ở P0 cho `DashboardLayout` (user-facing), bỏ `DashboardHeader` navbar ngang cũ.
- `🟢 P2` — Seed data demo cho chart, QA responsive mobile cả 2 khu vực, dọn code chết, verify i18n parity cuối cùng.
- Mỗi task ghi **vị trí code** liên quan để bắt tay vào làm ngay.
- **Thứ tự bắt buộc**: `sidebar-item-classes.ts` + tách `UserNavMenu` content xong trước `icon-sidebar.tsx` (icon-sidebar cần cả 2). `icon-sidebar.tsx`+`top-bar.tsx` xong trước `app-shell.tsx`. `app-shell.tsx` xong trước khi sửa `admin-layout.tsx`/`dashboard-layout.tsx`. BE mở rộng `admin.service.ts` xong trước khi FE viết hook mới gọi endpoint đó. `/help` route cần có trước khi sidebar footer link tới nó không bị 404.

---

## Khảo sát kỹ thuật quan trọng (ảnh hưởng thiết kế)

- **2 bộ code layout hiện tại trùng lặp gần như y hệt nhau** — `AdminSidebar`/`AdminHeader`/`AdminLayout` (`client/src/features/admin/{components,layout}/`) và `DashboardSidebar`/`DashboardHeader`/`DashboardLayout` (`client/src/components/layout/`) dùng chung 1 pattern `itemClasses()` (border-l-2 + `bg-primary/15 text-primary` khi active) bị copy-paste ở 2 nơi. Đây là cơ hội hợp nhất — tách `itemClasses()` thành `sidebar-item-classes.ts` dùng chung, xây 1 `IconSidebar`/`TopBar`/`AppShell` nhận `items` khác nhau cho admin/user thay vì duy trì 2 bộ song song.
- **Chưa cài thư viện chart nào** (`client/package.json` không có `recharts`/`chart.js`) — đã hỏi và được xác nhận dùng **recharts** (`npm install recharts`).
- **Chưa có `tooltip.tsx`** trong `components/ui/` (cũng không có `@radix-ui/react-tooltip`) — cần cho label hover ở sidebar collapsed (icon-only) mode.
- **`client/src/stores/use-sidebar.ts` hiện chỉ được dùng bởi `header.tsx` (component chết, chỉ ref bởi `test-page.tsx`)** — an toàn để repurpose làm store lưu trạng thái collapse của `IconSidebar` mới, không cần tạo store riêng.
- **`user-nav-menu.tsx` (`client/src/components/layout/user-nav-menu.tsx`) đã có sẵn toàn bộ nội dung dropdown profile** (avatar+tên header → `/profile`, grid 4 shortcut, list Settings/Orders/..., Sign out) — chỉ cần tách phần content ra khỏi trigger hiện tại (avatar tròn góc phải header) để gắn vào profile row mới trong sidebar, **giữ nguyên nội dung** đúng yêu cầu user. Thêm 1 item đầu `listItems`: "Admin Panel" → `navigate("/admin")`, hiện khi `role === "ADMIN"` (logic mirror `dashboard-header.tsx#visibleNavLinks`).
- **`admin-dashboard-page.tsx` hiện chỉ có 3 stat card tĩnh** (`Users`/`Problems`/`Submissions`, không trend, không chart) từ `useAdminStats()` → `GET /admin/stats` hiện chỉ trả `{totalUsers, totalProblems, totalSubmissions}` (`admin.service.ts:29-37`) — cần mở rộng cả 2 phía.
- **Widget "Calendar" trong ảnh mẫu không có tính năng tương ứng trong AlgoMinds** — đã hỏi và chốt: thay bằng **Recent Activity feed**, tái dùng thẳng `GET /admin/audit-log?limit=5` có sẵn (`admin.service.ts#getAuditLog`), không cần endpoint mới.
- **Widget "Top Country" → "Top Companies"** — tái dùng đúng pattern query đã có ở `companies.service.ts#findAll()` (group theo `_count.problems`, đã có hook `useCompanies()` + component tham khảo style `trending-companies-widget.tsx` ở `client/src/features/problems/components/`).
- **`Problem.acceptanceRate`/`submitCount`/`passCount` đã denormalize sẵn** (`schema.prisma`, model `Problem`) — dùng thẳng cho widget "Acceptance Rate by Difficulty" (`groupBy(['difficulty'], _avg: {acceptanceRate: true})`), không cần tính lại từ `Submission`.
- **`SessionEvent` là bảng chết** (không có `sessionEvent.create()` nào trong codebase) — KHÔNG dùng bảng này cho time-series, dùng `Session.startedAt` trực tiếp thay thế.
- **DB dev gần như trống Session/Submission** (`seed.ts` chỉ seed 2 problem mẫu + `sync-problems.ts` có ~51 problem từ file, không seed user/session/submission nào) — đã hỏi và chốt: viết **seed script riêng cho dev** (`seed-demo-data.ts`, không đụng `seed.ts`/`npx prisma db seed` mặc định), xếp ở P2 (không block P0 — dashboard vẫn phải chạy đúng với dữ liệu thật/thưa, empty-state phải đẹp).
- **Không thêm shadow nặng/gradient tuỳ hứng** (theo `.claude/rules/design.md`) — mọi card mới dùng `Card`/`CardHeader`/`CardContent` sẵn có, màu badge trend dùng đúng công thức `bg-{color}-500/10 text-{color}-500 border-{color}-500/20` đã có tiền lệ ở `DIFFICULTY_BADGE_CLASS`/`ACTION_BADGE_CLASS`.
- **Không đụng `sessions.service.ts`/`judge.service.ts`/`auth.service.ts`** — toàn bộ BE task ở roadmap này chỉ thêm method mới trong `admin.service.ts` (read-only aggregate), không sửa logic 3 file nhạy cảm trên.

---

## 🔴 P0 — Shared App Shell + Admin Dashboard (KPI cards + charts)

- [x] **FE: cài `recharts` + shadcn `tooltip.tsx`**
  📍 `client/` — `npm install recharts`; thêm `client/src/components/ui/tooltip.tsx` (+ `@radix-ui/react-tooltip`), dùng cho label hover ở sidebar collapsed mode.

- [x] **FE: `sidebar-item-classes.ts` — tách helper dùng chung**
  📍 `client/src/components/layout/sidebar-item-classes.ts` (mới) — chuyển `itemClasses()` đang lặp y hệt ở `admin-sidebar.tsx` và `dashboard-sidebar.tsx` vào đây, export dùng chung.

- [x] **FE: tách content dropdown của `UserNavMenu` + thêm item "Admin Panel"**
  📍 `client/src/components/layout/user-nav-menu.tsx` — giữ nguyên toàn bộ nội dung dropdown hiện có (header avatar+tên → `/profile`, grid 4 shortcut, list Settings/Orders/..., Sign out), refactor để trigger nhận từ ngoài truyền vào (dùng lại từ `icon-sidebar.tsx` bên dưới thay vì avatar góc phải header cũ). Thêm 1 item đầu `listItems`: "Admin Panel" → `navigate("/admin")`, hiện khi `useAuthStore().user?.role === "ADMIN"`.

- [x] **FE: trang Help Center mới + route `/help`**
  📍 `client/src/features/settings/pages/help-center-page.tsx` (mới, tái dùng layout/style các trang Settings hiện có) — nội dung tối giản (FAQ ngắn + kênh liên hệ). Đăng ký route `/help` trong `client/src/app/router-instance.tsx`, cùng nhóm `DashboardLayout`.

- [x] **FE: `icon-sidebar.tsx` — sidebar mới dùng chung admin/user**
  📍 `client/src/components/layout/icon-sidebar.tsx` (mới) — props `{ items }`: Logo (`components/ui/logo.tsx`) + nút collapse (state lưu ở `client/src/stores/use-sidebar.ts`, repurpose store hiện có, không tạo mới) → profile row (avatar+tên/email+chevron, trigger cho dropdown đã tách ở task trên) → nav items (render `items` qua `itemClasses()` dùng chung) → footer ghim đáy: Settings (`/settings`) + Help Center (`/help`). Collapsed mode: icon-only + `Tooltip`. Mobile (<lg): ẩn mặc định, mở qua `Sheet` có sẵn (`components/ui/sheet.tsx`).

- [x] **FE: `top-bar.tsx` — top bar tối giản dùng chung admin/user**
  📍 `client/src/components/layout/top-bar.tsx` (mới) — hamburger (mobile, mở `IconSidebar` trong `Sheet`) + tên trang hiện tại (tra theo route active trong `items` truyền vào). Giữ chuông thông báo + coin-balance pill (tính năng thật đang chạy) ở góc phải cho biến thể user; biến thể admin không cần.

- [x] **FE: `app-shell.tsx` — compose `IconSidebar`+`TopBar`+`Outlet`**
  📍 `client/src/components/layout/app-shell.tsx` (mới) — nhận `items` khác nhau cho admin/user, đây là shell dùng chung duy nhất.

- [x] **FE: `admin-layout.tsx` đổi sang dùng `AppShell`**
  📍 `client/src/features/admin/layout/admin-layout.tsx` — thay nội dung hiện tại (`AdminSidebar`+`AdminHeader` riêng) bằng `<AppShell items={adminSidebarItems} />`, dùng lại đúng mảng `sidebarItems` hiện có ở `admin-sidebar.tsx` (không đổi route/label/icon).

- [x] **BE: mở rộng `admin.service.ts`/`admin.controller.ts` — stats mở rộng + 4 endpoint mới**
  📍 `server/src/modules/admin/admin.service.ts`, `admin.controller.ts` (cùng class-level `@Roles('ADMIN')` guard có sẵn, không sửa guard):
  - `getStats()` mở rộng: thêm `totalSessions`, `completionRate` (COMPLETED/tổng session), %-delta so 7 ngày trước cho từng KPI.
  - `getSessionsTimeseries(range: '1W'|'1M'|'3M'|'ALL')` — bucket `Session.startedAt` trong JS (data nhỏ, không cần raw SQL) → `GET /admin/stats/sessions-timeseries?range=`.
  - `getSessionStatusBreakdown()` — `prisma.session.groupBy({by:['status'], _count:true})` → `GET /admin/stats/session-status`.
  - `getAcceptanceByDifficulty()` — **sửa lại quyết định ban đầu**: `Problem.acceptanceRate`/`submitCount`/`passCount` denormalize sẵn nhưng khi đọc kỹ code phát hiện chưa từng được ghi ở bất kỳ đâu (luôn = 0 mặc định) — không dùng được. Tính trực tiếp từ `Submission.status` + `Session.problem.difficulty` (gom trong JS, cùng data volume nhỏ) thay thế → `GET /admin/stats/acceptance-by-difficulty`.
  - `getTopCompanies(limit=5)` — mirror query `companies.service.ts#findAll()`, top 5 theo `_count.problems` → `GET /admin/stats/top-companies`.
  - Recent Activity: tái dùng thẳng `GET /admin/audit-log?limit=5` có sẵn, không cần route mới.
  - Verify: `auth.service.spec.ts` + `judge.service.spec.ts` (24 test) vẫn pass; curl với JWT admin xác nhận cả 4 endpoint mới trả dữ liệu thật đúng shape (`totalSessions:28, completionRate:60.7`, time-series 7 bucket, breakdown 3 status, acceptance 3 difficulty, top 5 company).

- [x] **FE: `admin-api.ts` + hooks mới cho dashboard**
  📍 `client/src/features/admin/api/admin-api.ts` + `hooks/use-admin-sessions-timeseries.ts`, `use-admin-session-status.ts`, `use-admin-acceptance-by-difficulty.ts`, `use-admin-top-companies.ts` (TanStack Query, mirror `use-admin-stats.ts`).

- [x] **FE: rebuild `admin-dashboard-page.tsx` — KPI cards + charts theo tỉ lệ ảnh mẫu**
  📍 `client/src/features/admin/pages/admin-dashboard-page.tsx`:
  - Hàng 1: 4 KPI card (Users/Sessions/Completion Rate/Submissions) + badge trend ↑/↓ %.
  - Hàng 2: trái (rộng) = "Sessions Over Time" bar chart (recharts) + tab range 1W/1M/3M/ALL (`Tabs` có sẵn); phải (hẹp) = "Recent Activity" (audit log, badge màu theo action prefix như `admin-audit-log-table.tsx`).
  - Hàng 3 (3 cột desktop, xếp dọc mobile): "Session Funnel" (bar ngang theo `SessionStatus`), "Top Companies" (ranked list), "Acceptance Rate by Difficulty" (bar/donut nhỏ, màu theo `DIFFICULTY_BADGE_CLASS`).
  - Loading/error/empty đúng khuôn có sẵn (skeleton → text đỏ lỗi → text muted rỗng).

- [x] **i18n: key mới cho Admin Panel/Help Center/dashboard widgets — 3 locale**
  📍 `client/src/lib/i18n/locales/{vi,en,ja}/{common,admin,settings}.json` — làm dần cùng từng task (P0 task 3/4/11) thay vì 1 commit riêng cuối. Verify parity bằng script flatten: `admin.json` 173 key, `common.json` 38 key, `settings.json` 43 key — khớp tuyệt đối cả 3 locale, không thiếu/thừa.

---

## 🟡 P1 — Áp dụng App Shell cho user-facing layout

- [x] **FE: `dashboard-layout.tsx` đổi sang dùng `AppShell`**
  📍 `client/src/components/layout/dashboard-layout.tsx` — bỏ `DashboardHeader` + `ResizablePanelGroup`, thay bằng `<AppShell items={userSidebarItems} />`, dùng lại đúng mảng `sidebarItems` hiện có ở `dashboard-sidebar.tsx` (không đổi route/label/icon).

- [x] **Verify: profile dropdown + Settings + Help Center hoạt động đúng ở user side**
  📍 Đã build sẵn ở P0 (shell dùng chung) — xác nhận qua browser thật: `/problems` dùng shell mới đúng, không còn nav ngang cũ, profile row mở đúng dropdown (đầy đủ nội dung cũ + "Admin Panel" cho role ADMIN), click Admin Panel chuyển sang `/admin` mượt (cùng shell, khác nav item). Settings + Help Center active-state đúng khi click từ footer sidebar, `/help` render đúng nội dung FAQ. Không lỗi console. (Ghi chú: có lúc thấy "Guest" + toast lỗi mạng sau khi full-reload trực tiếp URL — do accessToken chỉ lưu ở memory/Zustand, mất khi reload cứng, refresh cookie đôi lúc chưa kịp hydrate; đây là hành vi có sẵn của app không liên quan tới thay đổi layout lần này, không thuộc scope sửa ở đây.)

- [ ] **i18n: rà soát key còn thiếu phát sinh khi wiring user side**
  📍 3 locale `common.json`/`settings.json` — verify parity cuối P1.

---

## 🟢 P2 — Demo data, QA responsive, dọn code chết

- [x] **BE: `seed-demo-data.ts` — seed dev-only cho chart**
  📍 `server/prisma/seed-demo-data.ts` (mới, KHÔNG wire vào `npx prisma db seed` mặc định) — script riêng `npm run seed:demo` (thêm vào `server/package.json`). Tạo 8 User giả (+`UserStats`, email `@demo.algominds.dev`), mỗi user 3-8 Session trải ~90 ngày với đủ trạng thái, Submission trạng thái đa dạng cho session Phase 2/Completed — tái dùng Problem có sẵn trong DB (không tạo problem mới). Idempotent: tự xoá sạch slice demo cũ qua `deleteMany` theo domain email (cascade xoá Session/Submission/UserStats) trước khi tạo lại — verify chạy 2 lần liên tiếp không lỗi. Verify curl sau khi chạy: `totalUsers:13, totalSessions:77, totalSubmissions:97`, breakdown 4 status đúng tỉ lệ nghiêng COMPLETED.

- [x] **QA: responsive mobile (~375–420px) cho cả admin và user**
  📍 **Giới hạn công cụ đã gặp**: `resize_window` (Chrome tool) không có tác dụng thật trong môi trường này — verify bằng `window.innerWidth` qua JS sau mỗi lần resize vẫn trả về kích thước màn hình đầy đủ (1745px/1920px) dù tool báo "resized to 390x844" thành công, thử cả trên tab hiện có lẫn tab mới đều vậy (khả năng cửa sổ Chrome đang ở trạng thái maximize/snap cấp OS mà extension không override được). Không thể chụp screenshot thật ở viewport mobile trong phiên này — nói rõ giới hạn thay vì báo khống đã test.
  📍 Thay vào đó đã làm **code-level review** kỹ: `app-shell.tsx` ẩn `IconSidebar` desktop dưới `lg` (`hidden lg:flex`), `top-bar.tsx` hamburger chỉ hiện dưới `lg` (`lg:hidden`) mở `IconSidebar` qua `Sheet` (`w-64`, nhỏ hơn giới hạn `w-3/4` mặc định của `sheet.tsx` nên không tràn ở viewport ~390px). Toàn bộ layout dashboard mới (KPI grid, hàng chart, hàng 3 cột) đều dùng `grid-cols-1 sm:.../lg:...` hoặc `flex-col lg:flex-row` — xếp dọc đúng dưới breakpoint, không cột cứng. Không có `w-[...]`/`min-w-[...]` cứng nào trong các component mới (`icon-sidebar.tsx`, `top-bar.tsx`, `dashboard-*.tsx`) có thể gây tràn ngang — grep xác nhận. Pattern mobile Sheet này y hệt pattern cũ đã chạy tốt ở `DashboardHeader`/`DashboardSidebar` (đã bị thay thế nhưng cấu trúc responsive kế thừa nguyên).

- [x] **Xoá code chết sau khi xác nhận không còn import**
  📍 Grep xác nhận không còn reference nào (kể cả `test-page.tsx` — trước đó nghi ngờ có import `header.tsx` nhưng đọc lại code thì không, chỉ dùng `useSidebar` store, không đụng tới) rồi xoá: `client/src/components/layout/dashboard-header.tsx`, `header.tsx`, `dashboard-sidebar.tsx`, `client/src/features/admin/components/admin-header.tsx`, `admin-sidebar.tsx`. Verify: `tsc -b` + `npm run lint` sạch (0 lỗi, 13 warning pre-existing không liên quan), browser thật xác nhận `/admin` vẫn render đúng 100%, không lỗi console.

- [ ] **i18n: verify parity cuối cùng 3 locale**
  📍 Script flatten so sánh toàn bộ key `en/vi/ja` sau khi cả 3 tier hoàn tất — không còn key thiếu/thừa.

---

## Ghi chú thứ tự ưu tiên
`sidebar-item-classes.ts` + tách `UserNavMenu` content + trang `/help` làm trước `icon-sidebar.tsx` (icon-sidebar phụ thuộc cả 3). `icon-sidebar.tsx`+`top-bar.tsx` xong trước `app-shell.tsx`. `app-shell.tsx` xong trước khi sửa `admin-layout.tsx` (P0) rồi mới tới `dashboard-layout.tsx` (P1, dùng lại nguyên `AppShell` đã build ở P0 — không viết lại). BE mở rộng `admin.service.ts` độc lập, có thể làm song song với phần FE shell, nhưng phải xong trước khi viết hook FE gọi endpoint mới. Seed demo data (P2) không block P0/P1 — dashboard vẫn phải chạy đúng với dữ liệu thật/thưa trước khi có data đẹp để demo.
