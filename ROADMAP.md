# 🗺️ AlgoMinds — Roadmap: Module Contest (Cuộc thi)

> Bản roadmap trước (Career Journey P4-P7, Adaptive Readiness Engine) đã hoàn thành 100% và merge vào `main` — xem lịch sử git nếu cần tham chiếu lại nội dung cũ.
> Bản này thay thế nó, lên kế hoạch triển khai **Contest**: cuộc thi lập trình có nhiều bài, tính điểm theo độ khó, bảng xếp hạng (leaderboard) minh bạch kiểu ICPC (tổng điểm giảm dần, bằng điểm thì tổng thời gian+penalty tăng dần). Vì chưa có Admin Panel, dữ liệu mẫu đến từ 1 script seed riêng — việc tạo contest thật sau này do Admin thao tác thủ công.

## Cách đọc file này
- `🔴 P0` — Lõi bắt buộc: DB + seed mock data + API GET + FE xem được danh sách/chi tiết/leaderboard end-to-end.
- `🟡 P1` — Hoàn thiện: i18n, sidebar nav, polish UI.
- `🟢 P2` — Mở rộng (ngoài scope hiện tại, ghi lại để làm sau): nộp bài thật trong contest, Admin Panel tạo/sửa contest.
- Mỗi task ghi **vị trí code** liên quan để bắt tay vào làm ngay.

---

## 🔴 P0 — Lõi (xem được danh sách/chi tiết/leaderboard end-to-end)

- [x] **DB: enum `ContestStatus` + model `Contest`**
  📍 `server/prisma/schema.prisma`.
  ```prisma
  enum ContestStatus {
    UPCOMING
    ONGOING
    FINISHED
  }

  model Contest {
    id          String        @id @default(uuid())
    slug        String        @unique
    title       String
    description String
    startTime   DateTime
    endTime     DateTime
    status      ContestStatus @default(UPCOMING)
    createdAt   DateTime      @default(now())
    updatedAt   DateTime      @updatedAt

    problems    ContestProblem[]
    submissions ContestSubmission[]

    @@map("contests")
  }
  ```
  `slug` (unique) là bổ sung ngoài field đề bài liệt kê ban đầu — cần cho seed idempotent (`upsert`) và URL đẹp `/contests/:slug`, nhất quán với `Problem.slug` đã có.

- [x] **DB: model `ContestProblem` — gắn bài + điểm vào contest**
  📍 `server/prisma/schema.prisma`. Điểm theo độ khó khi seed: Easy 100đ / Medium 300đ / Hard 500đ, nhưng lưu trực tiếp trên bảng (không suy ra từ `Problem.difficulty` mỗi lần) để 1 bài có thể đổi điểm tuỳ contest.
  ```prisma
  model ContestProblem {
    id        String @id @default(uuid())
    contestId String
    problemId String
    points    Int
    order     Int    @default(0)

    contest Contest @relation(fields: [contestId], references: [id], onDelete: Cascade)
    problem Problem @relation(fields: [problemId], references: [id])

    @@unique([contestId, problemId])
    @@map("contest_problems")
  }
  ```
  Cần thêm quan hệ ngược `contestProblems ContestProblem[]` vào `model Problem`.

- [x] **DB: model `ContestSubmission` — lượt nộp bài trong contest**
  📍 `server/prisma/schema.prisma`. Tái dùng `enum SubmissionStatus` đã có (ACCEPTED/WRONG_ANSWER/COMPILE_ERROR/RUNTIME_ERROR/TLE/MLE) thay vì tạo enum pass/fail riêng.
  ```prisma
  model ContestSubmission {
    id             String           @id @default(uuid())
    contestId      String
    userId         String
    problemId      String
    status         SubmissionStatus
    submittedAt    DateTime         @default(now())
    penaltyMinutes Int              @default(0)

    contest Contest @relation(fields: [contestId], references: [id], onDelete: Cascade)
    user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
    problem Problem @relation(fields: [problemId], references: [id])

    @@index([contestId, userId])
    @@index([contestId, problemId])
    @@map("contest_submissions")
  }
  ```
  Cần thêm quan hệ ngược `contestSubmissions ContestSubmission[]` vào `model Problem` và `model User`.
  Sync bằng `npx prisma db push` (không tạo migration file, đúng giai đoạn prototype).

  Ghi chú: khi push, phát hiện local `feat/contest` được nhánh ra từ `main` TRƯỚC khi PR #17 (Career Journey) merge — DB dev local đã có sẵn các bảng career (do chạy migration trong lúc làm feat/new), nhưng schema của nhánh này chưa biết tới chúng. Đã fast-forward `feat/contest` lên `origin/main` (merge sạch, không có commit riêng nào bị mất) trước khi push, để `db push` không xoá nhầm data career đang có.

- [x] **DB: script seed mock data `server/prisma/seed-contests.ts`**
  📍 File mới, chạy độc lập (`npx ts-node prisma/seed-contests.ts`, thêm script `seed:contests` vào `package.json`), KHÔNG gắn vào `prisma.seed` chính — theo tiền lệ `seed-quest.ts`/`seed-badges.ts`.
  - 2 contest mẫu (`upsert` theo `slug`): `"AlgoMinds Weekly CodeSprint #1"` (status FINISHED, đã kết thúc) và `"Dynamic Programming Challenge"` (status ONGOING, đang diễn ra).
  - Gắn 4-5 `Problem` có sẵn trong DB vào mỗi contest (`ContestProblem`, `upsert` theo `contestId_problemId`, điểm theo `Problem.difficulty`).
  - 5-6 user giả (`upsert` theo `email`, mật khẩu hash cố định qua `bcrypt`).
  - `ContestSubmission` giả (`upsert` theo `id` tự đặt deterministic — không có tổ hợp field nào tự nhiên unique vì 1 user có thể nộp nhiều lần 1 bài) dựng kịch bản: có người dẫn đầu (giải hết, ít sai), có người giải 1 phần kèm penalty do nộp sai trước đó, có người chỉ giải bài Easy.
  - Log số lượng tạo/upsert khi chạy xong; chạy lại lần 2 không lỗi duplicate.

- [x] **BE: module `contest` mới**
  📍 `server/src/modules/contest/` (dùng skill `add-nestjs-module`): `contest.module.ts`, `contest.controller.ts`, `contest.service.ts` (không cần `dto/` — toàn bộ endpoint GET, không body).
  - `GET /contests` — public, danh sách kèm `problemCount` (qua `_count`, theo pattern `companies.service.ts`).
  - `GET /contests/:id` — public, chi tiết + danh sách bài (điểm/độ khó/order), nhận cả uuid lẫn slug.
  - `GET /contests/:id/leaderboard` — public, logic tính điểm ICPC (xem chi tiết thuật toán trong plan đã duyệt / code `contest.service.ts`): mỗi user, mỗi bài chỉ tính lần `ACCEPTED` đầu tiên; `totalScore` = tổng điểm bài đã giải; `totalPenaltyMinutes` = tổng (thời gian tới lúc giải + penalty các lần sai trước đó); sort điểm giảm dần rồi penalty tăng dần; kèm breakdown từng bài trong response để leaderboard minh bạch.

- [x] **FE: scaffold feature folder `contest`**
  📍 `client/src/features/contest/` (dùng skill `add-frontend-feature`, bám `features/quest/`).
  - `types/index.ts`, `api/contest-api.ts` (`getContests`, `getContestById`, `getLeaderboard`).
  - `hooks/use-contests.ts`, `use-contest.ts`, `use-contest-leaderboard.ts` (TanStack Query).
  - `components/contest-card.tsx` (thẻ danh sách), `components/contest-leaderboard-table.tsx` (bảng dùng `@/components/ui/table`, `Avatar` cho tên).
  - `pages/contest-list-page.tsx` (route `/contests`), `pages/contest-detail-page.tsx` (route `/contests/:id`).
  - Đăng ký route trong `client/src/app/router-instance.tsx` dưới `DashboardLayout`.

---

## 🟡 P1 — Hoàn thiện

- [x] **i18n: `contests.json` cho 3 ngôn ngữ**
  📍 `client/src/lib/i18n/locales/{en,vi,ja}/contests.json`, theo convention của `quest.json` (`title`, `subtitle`, `status.{upcoming,ongoing,finished}`, `leaderboard.{title,empty,rank,score,penalty}`).

- [x] **FE: nối mục "Contests" vào sidebar**
  📍 `client/src/components/layout/dashboard-sidebar.tsx` — thêm item trỏ `/contests` (theo đúng cách mục Quest đã được nối trước đây).

---

## 🟢 P2 — Mở rộng (ngoài scope hiện tại)

- [ ] **BE+FE: nộp bài thật trong contest** — `POST /contests/:id/submit` (cần `JwtAuthGuard`), chạy qua Piston giống `judge` module, tạo `ContestSubmission` thật thay vì chỉ đọc dữ liệu seed.
- [ ] **Admin Panel: CRUD contest** — form tạo/sửa/xoá `Contest`/`ContestProblem`, thay thế việc thao tác qua script seed/DB trực tiếp.

---

## Ghi chú thứ tự ưu tiên

DB đi trước BE, BE đi trước FE — FE cần contract API thật để gọi. Seed mock data (P0) phải xong trước khi build FE để có dữ liệu test ngay, tránh phải mock rồi sửa lại.
