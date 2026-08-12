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

- [x] **FE: đăng ký route `/admin/*`**
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

- [x] **FE: trang `/admin/contests` — data table**
  📍 `client/src/features/admin/pages/admin-contests-page.tsx` + `client/src/features/admin/components/admin-contests-table.tsx` — cột ID, Tiêu đề, Trạng thái (`Badge`, tái dùng `STATUS_BADGE_CLASS` từ `contest-table.tsx:18-23`), Thời gian bắt đầu. Dữ liệu từ `contestApi.getContests()` có sẵn. Nút "Tạo cuộc thi mới" stub console.log.

- [x] **FE: trang `/admin/users` — data table**
  📍 `client/src/features/admin/pages/admin-users-page.tsx` + `client/src/features/admin/components/admin-users-table.tsx` — cột ID, Email, Tên, Role (`Badge`), Ngày tạo. Dữ liệu từ `useAdminUsers()`.

- [x] **i18n: `admin.json` 3 locale**
  📍 `client/src/lib/i18n/locales/{vi,en,ja}/admin.json` — làm dần cùng từng trang thay vì 1 commit riêng cuối cùng (tránh hardcode string rồi phải sửa lại 2 lần). Verify tính đầy đủ: 43 key khớp nhau ở cả 3 locale (script flatten + so sánh), và mọi key `t("...")` dùng trong `src/features/admin/**` (kể cả key động qua `labelKey`/map như `STATUS_LABEL_KEY`, `difficulty.${...}`) đều có mặt trong file JSON. Đã xoá `problems.statusDeleted` (3 locale) vì không dùng đến — quyết định "Trạng thái" tĩnh ở khảo sát kỹ thuật khiến key này thành dead code.

---

## 🟡 P1 — Mở rộng sang domain khác (Store/Discuss/Career/Quests/Peer Interview, Read-only)

Quyết định đã chốt với user trước khi code: **`/admin/career` chỉ hiển thị bảng Career Tracks** (không làm Hiring Events, không gộp 2 bảng — có thể thêm Events ở P2 nếu cần sau).

- [x] **BE: mở rộng module `admin` — `GET /admin/quests` + `GET /admin/peer-interviews`** (gộp 1 commit — 2 hunk liền kề cùng file, tách patch không thêm giá trị)
  📍 `server/src/modules/admin/admin.service.ts`/`admin.controller.ts` — `getQuests()`: `prisma.bugSnippet.findMany({ orderBy: { createdAt: 'desc' } })`, trả đầy đủ field kể cả `buggyLine`/`explanation` (khác hẳn `GET quest/snippets` — endpoint đó cố tình strip 2 field này để chống lộ đáp án qua Network tab lúc chơi, xem `quest.controller.ts:23`). `getPeerInterviews()`: `prisma.peerInterviewSession.findMany({ select: {...} })` join `candidate{id,name,email}`, `peerInterviewer{id,name,email}` (nullable — session chưa có người join), `problem{id,title,slug}`, `orderBy: { startedAt: 'desc' }`. `peer-interview.controller.ts` hiện chỉ có `GET :id` (1 session) — đây là endpoint list đầu tiên cho domain này. Guard giữ nguyên `JwtAuthGuard + RolesGuard + @Roles('ADMIN')` ở class level của `AdminController`. Verify thực tế qua curl với JWT admin: `/admin/quests` trả đủ `buggyLine`/`explanation`, `/admin/peer-interviews` trả `[]` (DB dev chưa có session nào — đúng thực tế, không phải lỗi).

- [x] **FE: `AdminSidebar` — thêm 5 menu item mới** (gộp cùng commit: thêm sẵn toàn bộ key i18n cho 5 trang P1 vào `admin.json` 3 locale, để các trang sau dùng ngay không phải sửa lại — verify parity 101 key khớp cả 3 locale)
  📍 `client/src/features/admin/components/admin-sidebar.tsx` — thêm Store (`/admin/store`), Discuss (`/admin/discuss`), Career (`/admin/career`), Quests (`/admin/quests`), Peer Interview (`/admin/peer-interview`) vào mảng `sidebarItems`, sau `Users`. Icon: `Lock`=Store, `MessageSquare`=Discuss, `Compass`=Career, `Swords`=Quests, `Handshake`=Peer Interview (mirror icon set của `dashboard-sidebar.tsx` khi trùng nghĩa, tránh trùng icon `Users` đã dùng cho menu "Người dùng").

- [x] **FE: trang `/admin/store` — data table**
  📍 `admin-store-page.tsx` + `admin-store-table.tsx` — tái dùng `useStoreItems()` (`client/src/features/store/hooks/use-store-items.ts`, gọi `GET /store/items`), không viết API mới. Cột: ID, Tên, Danh mục (`Badge`, giá trị `ShopItemCategory`), Giá.

- [x] **FE: trang `/admin/discuss` — data table**
  📍 `admin-discuss-page.tsx` + `admin-discuss-table.tsx` — tái dùng `useDiscussPosts()` (`client/src/features/discuss/hooks/use-discuss-posts.ts`, gọi `GET /discuss`). Cột: ID, Tiêu đề, Tác giả, View/Upvote/Comment count, Ngày tạo.

- [x] **FE: trang `/admin/career` — data table (Tracks only)**
  📍 `admin-career-page.tsx` + `admin-career-table.tsx` — tái dùng `useCareerTracks()` (`client/src/features/career/hooks/use-career-tracks.ts`, gọi `GET /career/tracks`). Cột: ID, Tên track, Công ty (`track.company?.name` hoặc "Generic"), Trạng thái (`Badge`, theo `isActive`).

- [x] **FE: trang `/admin/quests` — data table**
  📍 `admin-quests-page.tsx` + `admin-quests-table.tsx` — dùng hook mới `useAdminQuests()` (`admin-api.ts` thêm `getQuests()` → `GET /admin/quests`). Cột: ID, Ngôn ngữ, Độ khó (`Badge`), Dòng lỗi (`buggyLine`), Trạng thái (`isActive` → Active/Inactive). Không hiển thị cột `code`/`explanation` đầy đủ trong bảng (quá dài cho 1 row) — để lại cho phase form chi tiết (P2).

- [x] **FE: trang `/admin/peer-interview` — data table**
  📍 `admin-peer-interview-page.tsx` + `admin-peer-interview-table.tsx` — dùng hook mới `useAdminPeerInterviews()` (`admin-api.ts` thêm `getPeerInterviews()` → `GET /admin/peer-interviews`). Cột: ID, Candidate, Interviewer (hoặc "Đang chờ" nếu null), Bài tập, Trạng thái (`Badge`, theo `PeerSessionStatus`), Bắt đầu lúc.

- [x] **FE: đăng ký 5 route mới**
  📍 `client/src/app/router-instance.tsx` — thêm 5 route con vào children của `/admin` (`store`, `discuss`, `career`, `quests`, `peer-interview`).

- [x] **i18n P1**: `sidebar.store/discuss/career/quests/peerInterview` + `store{}`/`discuss{}`/`career{}`/`quests{}`/`peerInterview{}` đã thêm sẵn ở commit sidebar. Verify cuối cùng sau khi toàn bộ 5 trang đã build xong: 101 key khớp cả 3 locale (script flatten), test end-to-end qua browser thật cho cả 5 trang (`store`/`discuss`/`career`/`quests`/`peer-interview`) — render đúng dữ liệu thật, không lỗi console, empty state hoạt động đúng (`peer-interview` chưa có data trong DB dev).

---

## 🟢 P2 — CRUD thật, phân trang/sort/search, audit log, RBAC (`MODERATOR`)

Quyết định đã chốt với user trước khi code:
- Làm **cả 4 mục** (CRUD, pagination/search, audit log, RBAC) trong round này, không tách nhỏ hơn nữa.
- **RBAC**: role mới `MODERATOR` chỉ có quyền duyệt/xoá bài **Discuss** — không đụng Problems/Contests/Users. Vào được `/admin` (thấy Dashboard + Discuss) nhưng bị chặn ở các trang admin khác.

### Khảo sát kỹ thuật quan trọng cho P2 (ảnh hưởng thiết kế)

- **`Contest` KHÔNG có `deletedAt`** (`schema.prisma:705-722`, khác `Problem`/`User`/`DiscussPost` đều có) — phải thêm field này qua migration mới để "Delete Contest" là soft-delete, tránh hard-delete cascade xoá mất `ContestProblem`/`ContestSubmission` (mất lịch sử thi thật).
- **`User.deletedAt` đã có sẵn** (`schema.prisma:84`) và đã được `findByEmail`/`findOne` lọc (`users.service.ts:16-17,70`) nhưng **chưa từng được set** — chưa có hàm xoá user nào tồn tại, phải viết từ đầu. Thêm chặn tự-xoá/tự-hạ-quyền chính mình (so `targetId !== currentUser.userId`) để admin không tự khoá mình ra khỏi hệ thống.
- **`DiscussPost.deletedAt`/`DiscussComment.deletedAt` đã có sẵn** (`schema.prisma:825,844`, đã lọc ở `discuss.service.ts:41,68,137,166`) nhưng cũng **chưa từng được set** — chưa có `DELETE /discuss/:id` nào. Route mới đặt trong `discuss.controller.ts` (đúng module, không phải `admin`), guard `@Roles('ADMIN', 'MODERATOR')` — `RolesGuard` đã hỗ trợ sẵn nhiều role trong 1 `@Roles(...)` (`roles.decorator.ts:3-4`), không cần sửa guard.
- **`CreateProblemDto` thiếu field `functionName`** (`create-problem.dto.ts`) dù `Problem.functionName` không có logic tự suy ra từ `initialCode` — mọi problem tạo qua Admin UI trước giờ (không có, vì chưa có UI) sẽ luôn bị `functionName: "solution"` mặc định của Prisma nếu không sửa DTO, sai với hàm thật trong code → PistonService gọi nhầm hàm lúc chấm. Bug tiềm ẩn, fix bằng cách thêm `functionName?: string` vào DTO khi làm form Create.
- **Slug tự sinh từ `title`** (`problems.service.ts:26`, `slugify(title, {lower:true, strict:true})`) — form Create/Update **không cần field slug**, chỉ cần `title`.
- **Không có endpoint `GET /tags`** và **không có tiền lệ multi-select tag** trong repo — `create-post-dialog.tsx` (discuss) dùng input text đơn, tag cách nhau dấu phẩy, tự `.split(",")` thành `tagNames: string[]`, tag `connectOrCreate` theo `name` (service tự slugify). **Tái dùng nguyên pattern này** cho form Problem thay vì xây multi-select mới — nhất quán với duy nhất tiền lệ có sẵn, không thêm phức tạp không cần thiết.
- **Contest hiện KHÔNG cho chọn tay từng problem** — `createContest` random-pick theo `problemCounts: {easy, medium, hard}` (`create-contest.dto.ts:11-23`, `contest.service.ts:162-209`). `ContestProblem` có field riêng `points`/`order` (`schema.prisma:726-738`) nên 1 UI "chọn tay + set points/order" sẽ là API + UI hoàn toàn mới, tách biệt khỏi cơ chế hiện tại. **Quyết định phạm vi**: form Create/Update Contest ở P2 dùng đúng cơ chế `problemCounts` random-pick sẵn có (title/description/thời gian + số lượng bài theo độ khó) — KHÔNG xây tính năng chọn tay problem (để P3 nếu cần, ghi chú lại).
- **Không có `alert-dialog.tsx`/`pagination.tsx`/`checkbox.tsx` trong `components/ui/`** — xây `ConfirmDialog` dùng lại `dialog.tsx` sẵn có (Dialog + Cancel/Confirm button) thay vì thêm primitive shadcn mới; xây `AdminPagination` là component feature-scoped trong `features/admin/components/`, không phải shadcn primitive chung (mirror quyết định "không thêm Sidebar primitive" đã làm ở P0).
- **Pagination/search KHÔNG áp lên `GET /problems`/`GET /contests` công khai** — 2 endpoint này đang được `ProblemsPage`/`ContestListPage` (trang user thật) tiêu thụ dưới dạng mảng phẳng, đổi response shape sẽ phá các trang đó. Thay vào đó xây **endpoint admin riêng có pagination**: `GET /admin/problems`, `GET /admin/contests` (mới) — đồng thời đây là cơ hội sửa đúng cột "Trạng thái" Problems đã ghi nhận là hạn chế ở P0 (do dùng chung `GET /problems` luôn filter `deletedAt: null`): endpoint admin mới này KHÔNG cần filter đó, trả `deletedAt` thật → cột "Trạng thái" hiển thị đúng Active/Deleted thay vì tĩnh "Hoạt động". `GET /admin/users` (đã có từ P0) chỉ cần bổ sung tham số `page/limit/search/sort` (thay đổi response shape từ mảng → `{data,total,page,limit}` — an toàn vì FE consumer duy nhất là `useAdminUsers()` do chính admin dashboard tự viết, sửa cả 2 phía cùng lúc).
- **DB migration làm 1 lần cho cả 3 thay đổi schema** (`UserRole` thêm `MODERATOR`, `Contest.deletedAt`, model `AdminActionLog` mới) — áp dụng bằng `npx prisma db push` (đúng tiền lệ prototype model mới gần đây), tránh chạy `db push` nhiều lần rời rạc.

### 🔴 P2a — Schema + BE nền tảng (làm trước, mọi task FE phụ thuộc)

- [x] **DB: `UserRole.MODERATOR` + `Contest.deletedAt` + model `AdminActionLog`**
  📍 `server/prisma/schema.prisma`
  ```prisma
  enum UserRole {
    USER
    ADMIN
    MODERATOR
  }

  model Contest {
    // ...các field hiện có...
    deletedAt DateTime? // Soft delete — mirror Problem/User
  }

  model AdminActionLog {
    id        String   @id @default(uuid())
    adminId   String
    action    String   // "CREATE_PROBLEM" | "UPDATE_PROBLEM" | "DELETE_PROBLEM" | "CREATE_CONTEST" | "UPDATE_CONTEST" | "DELETE_CONTEST" | "UPDATE_USER_ROLE" | "DELETE_USER" | "DELETE_DISCUSS_POST"
    targetType String  // "Problem" | "Contest" | "User" | "DiscussPost"
    targetId  String
    metadata  Json?    // vd { before, after } cho update
    createdAt DateTime @default(now())

    admin User @relation(fields: [adminId], references: [id], onDelete: Cascade)

    @@index([adminId])
    @@index([targetType, targetId])
    @@map("admin_action_logs")
  }
  ```
  Thêm quan hệ ngược `User.adminActionLogs AdminActionLog[]`. Áp dụng `npx prisma db push` + `npx prisma generate`.

- [x] **BE: `AdminAuditService` — helper ghi log dùng chung**
  📍 `server/src/modules/admin/admin-audit.service.ts` (mới) — 1 method `log(adminId, action, targetType, targetId, metadata?)` gọi `prisma.adminActionLog.create()`. Export qua `AdminModule`, import vào `ProblemsModule`/`ContestModule`/`DiscussModule` (hoặc gọi trực tiếp `PrismaService` — cân nhắc lúc code để tránh vòng phụ thuộc module, ưu tiên cách đơn giản nhất không tạo `forwardRef` mới).

- [x] **BE: `problems` — thêm Update/Delete + sửa `CreateProblemDto`** (verify thực tế: curl create→update→delete→confirm biến mất khỏi `GET /problems` công khai + audit log ghi đủ 3 dòng đúng `adminId`/`action`/`metadata`)
  📍 `problems.controller.ts` — `PATCH /problems/:id` (`UpdateProblemDto = PartialType(CreateProblemDto)`), `DELETE /problems/:id` (soft delete, set `deletedAt`), cả 2 guard `JwtAuthGuard + RolesGuard + @Roles('ADMIN')`, gọi `AdminAuditService.log()`.
  📍 `create-problem.dto.ts` — thêm `functionName?: string` (fix bug tiềm ẩn đã ghi ở khảo sát).
  📍 `problems.service.ts` — thêm `update()`/`softDelete()`.

- [x] **BE: `contest` — thêm Update/Delete** (verify thực tế: 17 test `contest.service.spec.ts` vẫn pass, curl update trên contest seed thật rồi revert lại title gốc, tạo/xoá 1 contest throwaway để test Delete không đụng dữ liệu demo, xác nhận biến mất khỏi `GET /contests` công khai)
  📍 `contest.controller.ts` — `PATCH /contests/:id` (title/description/startTime/endTime/status — KHÔNG đổi problem đã gán), `DELETE /contests/:id` (soft delete qua `deletedAt` mới thêm), guard `ADMIN`, gọi audit log.
  📍 `contest.service.ts` — thêm `update()`/`softDelete()`; `findAll()`/`findOne()` thêm `where: { deletedAt: null }` (hiện chưa filter vì field chưa tồn tại).

- [x] **BE: `admin` — `GET /admin/problems`, `GET /admin/contests` (paginated), mở rộng `GET /admin/users`** (verify curl: search/pagination hoạt động đúng, contest đã xoá ở task trước hiển thị đúng `deletedAt` trong list admin — khác `GET /contests` công khai. LƯU Ý: response shape `GET /admin/users` đổi từ mảng sang `{data,total,page,limit}` — `useAdminUsers()` FE tạm thời broken cho tới khi sửa ở task FE users, chấp nhận được vì cùng 1 người kiểm soát cả nhánh, không phải API đang được consume rộng rãi.)
  📍 `admin.service.ts`/`admin.controller.ts` — 3 endpoint dùng chung shape response `{ data, total, page, limit }`:
  - `GET /admin/problems?page=&limit=&search=&sortBy=&sortDirection=` — KHÔNG filter `deletedAt: null` mặc định (hoặc filter tuỳ query `includeDeleted`), select đủ `deletedAt` để FE hiển thị đúng Trạng thái.
  - `GET /admin/contests?page=&limit=&search=&sortBy=&sortDirection=`.
  - `GET /admin/users` mở rộng thêm param, đổi response shape sang `{data,total,page,limit}`.

- [x] **BE: `admin` — `PATCH /admin/users/:id/role`, `DELETE /admin/users/:id`**
  📍 Cùng module — đổi role (nhận `role: UserRole` mới, validate qua DTO, chặn `targetId === currentUser.userId`), soft-delete user (set `deletedAt`, chặn tự xoá chính mình). Cả 2 gọi audit log. Verify curl: đổi role QA Reviewer → MODERATOR → trả về USER, xác nhận chặn tự-đổi-role và tự-xoá chính tài khoản admin đang đăng nhập (400 đúng như thiết kế).

- [ ] **BE: `discuss` — `DELETE /discuss/:id` (moderation)**
  📍 `discuss.controller.ts`/`discuss.service.ts` — soft-delete set `deletedAt`, guard `JwtAuthGuard + RolesGuard + @Roles('ADMIN', 'MODERATOR')`, gọi audit log với `targetType: "DiscussPost"`.

- [ ] **BE: `admin` — `GET /admin/audit-log` (paginated)**
  📍 Cùng module, `@Roles('ADMIN')` (không cho MODERATOR xem — nhạy cảm). Join `admin{id,name,email}`, trả `{data,total,page,limit}`.

### 🟡 P2b — Frontend: component dùng chung, RBAC, CRUD 3 domain, moderation, audit log page

- [ ] **FE: `ConfirmDialog` + `AdminPagination` component dùng chung**
  📍 `client/src/features/admin/components/confirm-dialog.tsx` (dựa `dialog.tsx` sẵn có), `client/src/features/admin/components/admin-pagination.tsx` (prev/next + số trang, props `page/totalPages/onPageChange`).

- [ ] **FE: RBAC — `AdminRoute` cho phép `MODERATOR`, chặn trang ngoài Discuss**
  📍 `admin-route.tsx` — đổi điều kiện thành `role !== "ADMIN" && role !== "MODERATOR"` mới redirect. Thêm guard con mới `admin-only-route.tsx` (`role !== "ADMIN"` → `<Navigate to="/admin/discuss" />`) bọc riêng children Dashboard/Problems/Contests/Users/Store/Career/Quests/Peer-Interview/Audit-log trong `router-instance.tsx`; `discuss` route đứng ngoài, dùng chung `AdminRoute` thôi.
  📍 `admin-sidebar.tsx` — nhận biết role hiện tại (`useAuthStore`), MODERATOR chỉ thấy Dashboard + Discuss.

- [ ] **FE: `/admin/problems` — Create/Edit dialog + Delete + pagination/search**
  📍 `admin-problems-page.tsx`/`admin-problems-table.tsx` — đổi sang `useAdminProblems({page,search,sort})` (hook mới, gọi `GET /admin/problems`), thêm ô search + `AdminPagination`, cột Trạng thái đổi sang đọc `deletedAt` thật (Active/Deleted). Nút "Tạo bài tập mới" mở `problem-form-dialog.tsx` (title/difficulty/content/functionName/timeLimitMs/memoryLimitMb/tags input phẩy, initialCode/sampleTestCases/hiddenTestCases dạng textarea JSON có validate parse trước khi submit) — dùng chung cho Create lẫn Edit. Nút Delete mỗi row mở `ConfirmDialog`.

- [ ] **FE: `/admin/contests` — Create/Edit dialog + Delete + pagination/search**
  📍 Tương tự — `useAdminContests(...)`, `contest-form-dialog.tsx` (title/description/startTime/endTime + `problemCounts.easy/medium/hard`, đúng cơ chế random-pick hiện có, KHÔNG chọn tay problem).

- [ ] **FE: `/admin/users` — role change + Delete + pagination/search**
  📍 `useAdminUsers({page,search,sort})` (sửa hook cũ theo response shape mới). Cột Role đổi Badge tĩnh thành `Select` đổi role trực tiếp (USER/ADMIN/MODERATOR) — disable ở chính row của admin đang đăng nhập (so `user.id === currentUser.userId`). Nút Delete mỗi row (trừ row chính mình) mở `ConfirmDialog`.

- [ ] **FE: `/admin/discuss` — nút Delete (moderation), hiện cho cả ADMIN và MODERATOR**
  📍 `admin-discuss-table.tsx` — thêm cột hành động, nút Delete mở `ConfirmDialog`, gọi hook mới `useDeleteDiscussPost()`.

- [ ] **FE: trang mới `/admin/audit-log`**
  📍 `admin-audit-log-page.tsx` + `admin-audit-log-table.tsx` — `useAdminAuditLog({page})`, cột Admin/Action/Target/Thời gian. Sidebar item mới, chỉ hiện với ADMIN.

- [ ] **i18n**: thêm toàn bộ key mới cho form/dialog/pagination/role-select/audit-log 3 locale, verify parity như các round trước.

---

## Ghi chú thứ tự ưu tiên
Seed admin không phụ thuộc gì, làm trước để có tài khoản test. BE module `admin` xong trước khi FE viết `admin-api.ts`. `AdminRoute`/`AdminLayout` xong trước khi đăng ký route `/admin/*` trong `router-instance.tsx`. 3 trang data table (`problems`/`contests`/`users`) độc lập với nhau, có thể làm theo thứ tự bất kỳ sau khi route đã đăng ký — nhưng `users` phụ thuộc `GET /admin/users` đã xong ở BE.
