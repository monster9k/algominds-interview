# 🗺️ AlgoMinds — Roadmap: Admin Dashboard (nền tảng)

> Bản roadmap trước (Thảo luận/Discuss — forum kiểu LeetCode) đã hoàn thành 100% ở P0/P1 và merge vào `main` — xem lịch sử git (commit cuối chỉnh sửa: `b879622`) nếu cần tham chiếu lại nội dung cũ. P2 của bản đó (reply lồng nhau, report/flag + duyệt admin, sửa/xoá bài, thông báo real-time, dedupe view count) vẫn còn treo nhưng nằm ngoài scope hiện tại — không đụng tới trong roadmap này.
> Bản này thay thế nó. Mục tiêu: dựng **nền tảng** Admin Dashboard — phân quyền, layout admin, data table danh sách (Read-only) cho Bài tập và Cuộc thi. Các form Create/Update/Delete phức tạp **không** làm ở roadmap này (theo đúng yêu cầu — để phase sau).
>
> **Lệch stack cần lưu ý**: yêu cầu gốc mô tả theo convention Next.js App Router (`app/(admin)/admin/layout.tsx`, Middleware) — nhưng repo này dùng **React Router v7** (`client/src/app/router-instance.tsx:32`, `createBrowserRouter`), không phải Next.js, không có khái niệm middleware server-side cho route FE. Roadmap này thay bằng: route group lồng trong `router-instance.tsx` + component `AdminRoute` chặn ở client (mirror `ProtectedRoute` sẵn có), đúng pattern đang dùng cho `/interview/:slug` (`router-instance.tsx:71-91`).

## Cách đọc file này
- `🔴 P0` — Lõi bắt buộc: seed tài khoản admin, module backend `admin` (stats + list users), `AdminRoute` guard FE, `AdminLayout`/`AdminSidebar`/`AdminHeader`, trang `/admin` (stat card), `/admin/problems`, `/admin/contests`, `/admin/users` (data table, Read-only), i18n `admin.json` 3 ngôn ngữ.
- `🟡 P1` — Mở rộng sang các domain khác mà user liệt kê thêm cuối yêu cầu gốc (`/admin/quests`, `/admin/career`, `/admin/peer-interview`, `/admin/discuss`, `/admin/store`) — **chưa làm ở lượt này** vì (a) câu context gốc chỉ nói rõ phạm vi "nền tảng" là Bài tập + Cuộc thi, (b) một số domain thiếu sẵn API list phù hợp cho admin (xem ghi chú gap từng mục).
- `🟢 P2` — Ngoài scope: form Create/Update/Delete thật, phân trang/sort/search cho bảng admin, audit log hành động admin, RBAC nhiều cấp hơn `USER`/`ADMIN`.
- Mỗi task ghi **vị trí code** liên quan để bắt tay vào làm ngay.
- **Thứ tự bắt buộc**: seed admin (P0, mục đầu) không phụ thuộc gì, làm trước để có tài khoản test guard. Module `admin` BE xong trước khi FE gọi `admin-api.ts`. `AdminRoute` + `AdminLayout` xong trước khi đăng ký route `/admin/*`. Các trang `/admin/problems`, `/admin/contests` phụ thuộc `AdminLayout` đã đăng ký route.

---

## Khảo sát kỹ thuật quan trọng (ảnh hưởng thiết kế)

- **Đã có sẵn, không cần tạo mới**: `User.role UserRole @default(USER)` (`server/prisma/schema.prisma:69`, enum `UserRole { USER, ADMIN }` tại dòng 11-14) — **không cần migration/schema change**. `RolesGuard` (`server/src/common/guards/roles.guard.ts:16-35`, đọc metadata qua `Reflector`, `ForbiddenException` nếu role không khớp) + `@Roles(...)` decorator (`server/src/common/decorators/roles.decorator.ts:3-4`) đã có tiền lệ dùng thật ở `problems.controller.ts:25-27` (`POST /problems`) và `contest.controller.ts:19-21` (`POST /contests`) — module `admin` mới tái dùng y hệt cặp guard này, không viết lại.
- **Chưa có module `admin`** trong `server/src/modules/*` — tạo mới theo skill `add-nestjs-module`, chỉ 2 endpoint GET (`stats`, `users`), không có job nền, tham khảo cấu trúc đơn giản của module `store` (`store.controller.ts`).
- **Danh sách Bài tập/Cuộc thi: tái dùng nguyên API GET đã có, không tạo endpoint admin riêng** — `GET /problems` (`problems.controller.ts:33-52`, `OptionalJwtAuthGuard`) và `GET /contests` (`contest.controller.ts:19-30`) đã trả đủ dữ liệu cần cho bảng admin; FE gọi thẳng `problemsApi.getProblems()` (`client/src/features/problems/api/problems-api.ts:5`) và `contestApi.getContests()` (`client/src/features/contest/api/contest-api.ts:19`) — không viết thêm hook/API mới cho 2 domain này.
- **Cột "Trạng thái" của bảng Problems — sửa lại quyết định ban đầu sau khi đọc kỹ `problems.service.ts:65-146`**: `GET /problems` luôn `where: { deletedAt: null }` (dòng 74) và **không** `select` field `deletedAt` — nên không thể tái dùng `deletedAt` để phân biệt Active/Deleted như dự tính lúc đầu (mọi row trả về chắc chắn đều active). Đáng chú ý hơn: response **đã có sẵn field `status`** (`Todo`/`Attempted`/`Solved`, dòng 109-120) nhưng đó là **trạng thái giải bài của user gọi API** (ở đây là chính admin đang đăng nhập), không phải trạng thái publish của problem — **không được dùng nhầm field này cho cột "Trạng thái" admin**. Quyết định cuối: cột "Trạng thái" ở bảng Problems hiển thị tĩnh "Hoạt động" cho mọi row (đúng thực tế 100% row trả về đều vậy), kèm comment giải thích trong code — không sửa `problems.service.ts` để thêm phân biệt Deleted thật (ngoài scope "chỉ tái dùng API sẵn có" của roadmap này). Cột "Trạng thái" của Contest thì dùng thẳng `Contest.status ContestStatus` (`schema.prisma:712`, `UPCOMING`/`ONGOING`/`FINISHED`) — đã có sẵn Badge màu mẫu ở `contest-table.tsx:18-23` (`STATUS_BADGE_CLASS`), tái dùng đúng bảng màu này cho nhất quán.
- **Chưa có API "list toàn bộ user"** — `users.controller.ts` hiện chỉ có `GET users/me` (không list). Đây là gap thật cần bổ sung ở module `admin` mới (`GET /admin/users`), không phải lỗi thiếu sót cần "fix" ở module `users` — đặt đúng namespace `admin` vì đây là nhu cầu riêng của dashboard quản trị (list toàn bộ, không phải profile cá nhân).
- **FE `ProtectedRoute` hiện tại chỉ check đăng nhập, không check role** (`client/src/features/auth/components/protected-route.tsx:5-19`, chỉ đọc `isAuthenticated`/`isLoading` từ `useAuthStore`). `User` type (`client/src/features/auth/types/index.ts:16-22`) **đã có field `role: string`** sẵn trong JWT payload trả về lúc login — đủ để viết `AdminRoute` mới (component riêng, KHÔNG sửa `ProtectedRoute` hiện có vì nó đang được dùng đúng cho luồng interview/peer-interview/contest-solve, sửa chung sẽ ảnh hưởng các route đó).
- **Không cần thêm shadcn `Sidebar` primitive tổng quát** — `DashboardSidebar` hiện tại (`client/src/components/layout/dashboard-sidebar.tsx`) cũng không dùng primitive `sidebar.tsx` nào cả, chỉ là `div` + `Link` + `cn()` thuần (đã có sẵn style pattern `itemClasses()` dòng 26-32). `AdminSidebar` sẽ theo đúng pattern này để nhất quán — không giới thiệu abstraction mới, không chạy `npx shadcn add sidebar`.
- **`AdminLayout` không cần resizable panel** như `DashboardLayout` (`dashboard-layout.tsx` dùng `ResizablePanelGroup` cho trải nghiệm người dùng cuối) — admin dashboard chỉ cần sidebar cố định đơn giản (`flex`), tránh phức tạp hoá không cần thiết.
- **Bảng dữ liệu**: `client/src/components/ui/table.tsx` đã có sẵn, cách dùng mẫu chuẩn ở `contest-table.tsx` (loading skeleton, empty state, error state) — `AdminProblemsTable`/`AdminContestsTable`/`AdminUsersTable` bám sát khuôn này.
- **Seed admin**: `server/prisma/seed.ts` hiện chưa seed `User` nào cả. Password hash dùng `bcrypt.hash(..., 10)` đúng round hiện tại của `auth.service.ts:58`. Cần `import * as bcrypt from 'bcrypt'` vào `seed.ts`.
- **i18n**: `client/src/lib/i18n/locales/{vi,en,ja}/` chưa có `admin.json` — namespace mới, theo đúng pattern 3 locale hiện dùng cho các feature khác.

---

## 🔴 P0 — Phân quyền, layout admin, data table Bài tập/Cuộc thi/Users (Read-only)

- [x] **BE: seed tài khoản admin**
  📍 Đã có sẵn — `server/prisma/seed-contests.ts:20-40` (`npm run seed:contests`) đã upsert đúng 1 tài khoản `admin@algominds.dev` / `Admin@12345` với `role: ADMIN`, verify thực tế bằng `POST /auth/login` → nhận JWT `role: "ADMIN"` thành công. Ban đầu định thêm 1 block seed admin mới vào `seed.ts` nhưng phát hiện trùng lặp với script này (khác password → gây nhầm login fail lúc test), đã revert phần thêm đó, không tạo 2 nguồn seed admin song song.
  Bonus: tài khoản thật của user (`monster722006@gmail.com`) qua `GET /admin/users` xác nhận **đã có sẵn `role: "ADMIN"`** — không cần thao tác gì thêm cho ý "hoặc update tài khoản hiện tại thành ADMIN".

- [x] **BE: module `admin` mới — `GET /admin/stats`, `GET /admin/users`**
  📍 `server/src/modules/admin/` (`admin.module.ts`, `admin.controller.ts`, `admin.service.ts`), đăng ký vào `AppModule`.
  ```
  GET /admin/stats   JwtAuthGuard + RolesGuard + @Roles('ADMIN')
    → { totalUsers, totalProblems, totalSubmissions } (prisma.user.count() / problem.count() / submission.count())

  GET /admin/users   JwtAuthGuard + RolesGuard + @Roles('ADMIN')
    → danh sách user: select id, email, name, role, isPro, createdAt (KHÔNG select password/providerId)
  ```
  Guard pattern tái dùng y hệt `problems.controller.ts:25-27`.

- [x] **FE: `AdminRoute` guard component**
  📍 `client/src/features/auth/components/admin-route.tsx` — mirror `protected-route.tsx`, thêm check `user?.role === "ADMIN"` sau khi đã xác nhận `isAuthenticated`; không phải ADMIN → `<Navigate to="/problems" replace />`.

- [x] **FE: feature folder `admin` — api + hooks**
  📍 `client/src/features/admin/`:
  - `api/admin-api.ts`: `getStats()` → `GET /admin/stats`, `getUsers()` → `GET /admin/users`.
  - `hooks/use-admin-stats.ts`, `hooks/use-admin-users.ts` (TanStack Query, mirror `use-user-profile.ts`).
  - `types/index.ts`: `AdminStats`, `AdminUser`.

- [x] **FE: `AdminSidebar` + `AdminHeader` + `AdminLayout`**
  📍 `client/src/features/admin/components/admin-sidebar.tsx` — 4 menu tĩnh: Tổng quan (`/admin`), Bài tập (`/admin/problems`), Cuộc thi (`/admin/contests`), Người dùng (`/admin/users`), theo đúng `itemClasses()`/cấu trúc `dashboard-sidebar.tsx:16-24, 26-32`.
  📍 `client/src/features/admin/components/admin-header.tsx` — logo/title "Admin", `Avatar` (tái dùng `useAuthStore` lấy `user.name`/`user.avatarUrl` giống `user-nav-menu.tsx:74-75`), nút "Về trang chính" (`Link to="/problems"`).
  📍 `client/src/features/admin/layout/admin-layout.tsx` — `<div className="h-screen flex"><AdminSidebar/><div className="flex-1 flex flex-col"><AdminHeader/><main className="flex-1 overflow-y-auto p-6"><Outlet/></main></div></div>`.

- [ ] **FE: đăng ký route `/admin/*`**
  📍 `client/src/app/router-instance.tsx` — thêm route group mới (ngang hàng khối `ProtectedRoute` hiện có, dòng 71-91):
  ```tsx
  {
    element: <AdminRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "problems", element: <AdminProblemsPage /> },
          { path: "contests", element: <AdminContestsPage /> },
          { path: "users", element: <AdminUsersPage /> },
        ],
      },
    ],
  }
  ```

- [x] **FE: trang `/admin` — stat card**
  📍 `client/src/features/admin/pages/admin-dashboard-page.tsx` — 3 `Card` (shadcn) hiển thị Tổng số Users/Bài tập/Submissions từ `useAdminStats()`, loading skeleton khi đang fetch.

- [x] **FE: trang `/admin/problems` — data table**
  📍 `client/src/features/admin/pages/admin-problems-page.tsx` + `client/src/features/admin/components/admin-problems-table.tsx` — cột ID (`displayId`), Tiêu đề, Độ khó (`Badge`), Trạng thái (theo `deletedAt`, xem khảo sát kỹ thuật). Dữ liệu từ `problemsApi.getProblems()` có sẵn (không viết hook mới, dùng `useQuery` trực tiếp hoặc hook `useProblems` đã có trong feature `problems` nếu phù hợp). Nút "Tạo bài tập mới" (`Button` + `onClick={() => console.log("TODO: create problem modal")}`).

- [ ] **FE: trang `/admin/contests` — data table**
  📍 `client/src/features/admin/pages/admin-contests-page.tsx` + `client/src/features/admin/components/admin-contests-table.tsx` — cột ID, Tiêu đề, Trạng thái (`Badge`, tái dùng `STATUS_BADGE_CLASS` từ `contest-table.tsx:18-23`), Thời gian bắt đầu. Dữ liệu từ `contestApi.getContests()` có sẵn. Nút "Tạo cuộc thi mới" stub console.log.

- [ ] **FE: trang `/admin/users` — data table**
  📍 `client/src/features/admin/pages/admin-users-page.tsx` + `client/src/features/admin/components/admin-users-table.tsx` — cột ID, Email, Tên, Role (`Badge`), Ngày tạo. Dữ liệu từ `useAdminUsers()`.

- [ ] **i18n: `admin.json` 3 locale**
  📍 `client/src/lib/i18n/locales/{vi,en,ja}/admin.json` — sidebar labels, header, tiêu đề trang, tên cột bảng, empty/loading/error state, nút "Tạo mới". Đăng ký namespace `admin` vào cấu hình i18next (mirror cách các feature khác đã đăng ký, tìm file `client/src/lib/i18n/index.ts` hoặc tương đương).

---

## 🟡 P1 — Mở rộng sang domain khác (chưa làm ở lượt này, ghi lại để làm sau)

Các trang này nằm trong yêu cầu gốc của user nhưng **không khớp với câu context "bắt đầu bằng nền tảng: Problems & Contests"** — để tránh phình scope nền tảng, roadmap này chỉ ghi nhận lại, chưa code:

- [ ] **`/admin/store`** (không phải `/admin/stores` — tên module thật số ít, route `store.controller.ts` là `@Controller('store')`). Data có sẵn: `GET store/items` (`store.controller.ts:13`) — làm tương tự pattern Problems/Contests, không có gap backend.
- [ ] **`/admin/discuss`**. Data có sẵn: `GET /discuss` (`discuss.controller.ts:24`) — không có gap backend, làm được ngay theo pattern P0.
- [ ] **`/admin/career`**. Data có sẵn: `GET career/tracks`, `GET career/events` (`career.controller.ts:16,26`) — nhưng chưa rõ user muốn liệt kê "track" hay "event" hay cả hai ở 1 bảng, cần hỏi lại trước khi thiết kế cột.
- [ ] **`/admin/quests`**. **Gap backend**: `GET quest/snippets` (`quest.controller.ts:23`) cố tình strip `buggyLine`/`explanation` trước khi trả về (chống lộ đáp án qua Network tab, xem `CLAUDE.md` mục `quest`) — admin cần thấy đủ đáp án nên **không thể tái dùng endpoint này**, phải thêm `GET /admin/quests` riêng (RolesGuard) trả đầy đủ field `BugSnippet`.
- [ ] **`/admin/peer-interview`**. **Gap backend**: `peer-interview.controller.ts` hiện chỉ có `GET :id` (lấy 1 session), không có endpoint list nhiều session — phải thêm `GET /admin/peer-interviews` (hoặc mở rộng module `peer-interview`) trước khi làm UI.

---

## 🟢 P2 — Ngoài scope hiện tại

- [ ] Form Create/Update/Delete thật cho Problems/Contests/Users (hiện tại nút "Tạo mới" chỉ console.log theo đúng constraint round này).
- [ ] Phân trang/sort/search cho các bảng admin (hiện `GET /admin/users`, `GET /problems`, `GET /contests` trả nguyên mảng, chưa cần thiết ở quy mô dữ liệu hiện tại).
- [ ] Audit log hành động admin (ai sửa/xoá gì, khi nào) — chưa có tiền lệ `AdminActionLog` nào trong schema.
- [ ] RBAC nhiều cấp hơn `USER`/`ADMIN` (vd `MODERATOR` chỉ duyệt discuss, không sửa problems).
- [ ] Bảo vệ `/admin/*` ở tầng server-side/SSR — không áp dụng cho stack Vite CSR hiện tại, chỉ có thể chặn ở client (`AdminRoute`) + guard BE cho mọi API ghi (đã có).

---

## Ghi chú thứ tự ưu tiên
Seed admin không phụ thuộc gì, làm trước để có tài khoản test. BE module `admin` xong trước khi FE viết `admin-api.ts`. `AdminRoute`/`AdminLayout` xong trước khi đăng ký route `/admin/*` trong `router-instance.tsx`. 3 trang data table (`problems`/`contests`/`users`) độc lập với nhau, có thể làm theo thứ tự bất kỳ sau khi route đã đăng ký — nhưng `users` phụ thuộc `GET /admin/users` đã xong ở BE.
