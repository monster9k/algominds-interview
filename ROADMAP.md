# 🗺️ AlgoMinds — Roadmap: Contest v2 (nộp bài thật + UI overhaul)

> Bản roadmap trước (Contest P0-P1: DB, seed mock data, API GET, FE xem-only) đã hoàn thành 100% và merge vào `main` — xem lịch sử git (`213b871`, `27f41da`) nếu cần tham chiếu lại nội dung cũ.
> Bản này thay thế nó. Lý do: Contest hiện tại chỉ "xem được" — leaderboard chạy hoàn toàn bằng data giả (6 user ảo + `ContestSubmission` viết kịch bản sẵn trong `seed-contests.ts`), không có đường nộp bài thật nào, không tạo được contest mới ngoài chỉnh script/DB tay, và UI quá sơ sài so với các trang khác trong app (đối chiếu `client/src/features/problems/`). Roadmap này đóng các khoảng trống đó: nộp bài thật chấm qua Piston (ghi `ContestSubmission` thật, xoá sạch data giả), tạo contest với bài **random** từ pool `Problem` có sẵn qua 1 API admin-gated, và redesign UI theo hướng tham khảo các nền tảng thi đấu lập trình phổ biến (đếm ngược, trạng thái giải-từng-bài, leaderboard có rank nổi bật) kết hợp design system sẵn có của app (shadcn primitives, quy ước màu độ khó, pattern loading/error/empty của `problems-page.tsx`).

## Cách đọc file này
- `🔴 P0` — Lõi bắt buộc: nộp bài thật end-to-end (Run/Submit qua Piston, ghi `ContestSubmission` thật), xoá toàn bộ data giả, trang giải bài (solve page) mới trên FE.
- `🟡 P1` — Hoàn thiện: API admin tạo contest (bài random theo độ khó), redesign UI list/detail/leaderboard, i18n, fix link chết.
- `🟢 P2` — Mở rộng (ngoài scope hiện tại, ghi lại để làm sau): Admin Panel UI, chế độ luyện tập đầy đủ sau khi contest kết thúc, đăng ký/roster contest chính thức, AI evaluation cho bài nộp trong contest.
- Mỗi task ghi **vị trí code** liên quan để bắt tay vào làm ngay.
- **Lưu ý thứ tự bắt buộc**: task tách `TestExecutionService` (P0, mục đầu tiên) phải xong và pass full test suite `judge` + `contest` TRƯỚC khi làm bất kỳ task nào khác đụng vào chấm bài — mọi logic Run/Submit của contest đều phụ thuộc vào service này.

---

## 🔴 P0 — Nộp bài thật, xoá dữ liệu giả

- [x] **BE: tách logic chạy test case ra module `code-execution` dùng chung**
  📍 Module mới `server/src/modules/code-execution/`, di dời từ `server/src/modules/judge/services/`.
  - `services/piston.service.ts`, `services/code-generator.service.ts` — move nguyên vẹn.
  - `services/test-execution.service.ts` — **mới**, chứa logic `runTestCases`/`runSingleTestCase`/`outputsMatch`/`stripWhitespace`/`normalizeOutput` hiện đang private trong `judge.service.ts:356-515`, expose 1 method public:
    ```ts
    runTestCases(language, code, functionName, testCases, limits):
      Promise<{ results, passedTests, finalStatus, executionTime, memoryUsage }>
    ```
  - `code-execution.module.ts` export `TestExecutionService`, `CodeGeneratorService`, `PistonService`.
  - Sửa `judge.module.ts` import `CodeExecutionModule`; `JudgeService` constructor đổi thành `(prisma, testExecution, eventEmitter)`, gọi `testExecution.runTestCases(...)` thay vì method private cũ.
  - `judge.service.spec.ts`: sửa **cơ học** — trong `beforeEach`, dựng 1 `TestExecutionService` thật, wire với đúng mock `codeGenerator`/`pistonService` hiện có, rồi đưa vào `JudgeService`. Vì code move nguyên vẹn nên assertion hiện có (phân loại TLE/MLE/COMPILE_ERROR, shape transaction, emit event) không cần đổi logic — chỉ đổi phần wiring. Chạy lại toàn bộ spec `judge` trước khi làm bất kỳ task nào khác, đúng nguyên tắc "cẩn thận gấp đôi" của `workflow.md` với file này.
  - `contest.module.ts` import `CodeExecutionModule`, inject `TestExecutionService` vào `ContestService`.

- [x] **DB: mở rộng `ContestSubmission` để có audit trail đầy đủ**
  📍 `server/prisma/schema.prisma`.
  ```prisma
  model ContestSubmission {
    id             String           @id @default(uuid())
    contestId      String
    userId         String
    problemId      String
    status         SubmissionStatus
    submittedAt    DateTime         @default(now())
    penaltyMinutes Int              @default(0)

    code            String  @default("")
    language        String  @default("javascript")
    passedTests     Int     @default(0)
    totalTests      Int     @default(0)
    executionTime   Int?
    memoryUsage     Int?
    testCaseResults Json?

    contest Contest @relation(fields: [contestId], references: [id], onDelete: Cascade)
    user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
    problem Problem @relation(fields: [problemId], references: [id])

    @@index([contestId, userId])
    @@index([contestId, problemId])
    @@map("contest_submissions")
  }
  ```
  Đưa lên bằng `npx prisma db push` (đúng convention prototype đã dùng khi tạo model này lần đầu, không tạo migration file).

- [x] **BE: fix bug tiềm ẩn — `Contest.status` không bao giờ tự chuyển trạng thái**
  📍 `server/src/modules/contest/contest.service.ts`.
  Hiện tại `Contest.status` là cột DB tĩnh, không có cron/scheduler nào chuyển `UPCOMING→ONGOING→FINISHED` theo thời gian thực — chỉ được set 1 lần lúc seed. Một khi có luồng nộp bài thật, guard theo cột này sẽ khiến contest tạo với `startTime` trong tương lai **không bao giờ nộp bài được** khi tới giờ, trừ khi sửa tay DB. Fix: thêm helper thuần
  ```ts
  function deriveContestStatus(startTime: Date, endTime: Date, now = new Date()): ContestStatus {
    if (now < startTime) return 'UPCOMING';
    if (now > endTime) return 'FINISHED';
    return 'ONGOING';
  }
  ```
  và dùng nó ở MỌI nơi đọc/guard theo status (`findAll`, `findOne`, `getLeaderboard`, guard Run/Submit) — không bao giờ tin cột DB cho logic gating (vẫn giữ cột DB làm fallback hiển thị).

- [x] **BE: `ContestService` — API giải bài thật**
  📍 `server/src/modules/contest/contest.service.ts`, tham chiếu `judge.service.ts` (`runCode`/`submitCode`) và `problems.service.ts` (`findOne` — safe select không lộ `hiddenTestCases`).
  - `findOne(idOrSlug, userId?)`: mở rộng enrich `myStatus: { solved, attempts }` theo từng bài khi có `userId` (mirror pattern enrichment của `problems.service.findAll`).
  - `getContestProblem(contestIdOrSlug, problemSlug, userId?)`: safe select đề bài + status contest derived + `myStatus`/lịch sử nộp nếu đã đăng nhập.
  - `runContestProblem(userId, contestIdOrSlug, problemSlug, code, language)`: guard `deriveContestStatus(...) === 'ONGOING'` (message riêng cho chưa-bắt-đầu và đã-kết-thúc), chỉ chạy `sampleTestCases` qua `testExecution.runTestCases`, **không ghi DB** (giống `judge.runCode`).
  - `submitContestProblem(userId, contestIdOrSlug, problemSlug, code, language)`: cùng guard, chạy sample + hidden test cases, ghi 1 dòng `contestSubmission.create` (không cần `$transaction` — không có bảng liên quan nào khác phải ghi cùng lúc, khác với `judge.submitCode` phải ghi Submission+UserStats+Session):
    ```ts
    const penaltyMinutes = finalStatus === 'ACCEPTED' ? 0 : WRONG_PENALTY_MINUTES; // 20
    ```
    Khớp với logic đọc leaderboard hiện có (`contest.service.ts:141`, không đổi) vốn đã giả định `penaltyMinutes` được ghi sẵn theo từng dòng lúc submit. **Không emit event AI code-evaluation** — contest là luồng thi tốc độ độc lập, không nối vào listener `submission.accepted`.
  - Chuyển 2 hằng số `WRONG_PENALTY_MINUTES = 20` và `POINTS_BY_DIFFICULTY` (Easy 100/Medium 300/Hard 500) từ `seed-contests.ts` vào file này.

- [x] **BE: DTO cho Run/Submit contest**
  📍 `server/src/modules/contest/dto/run-contest-problem.dto.ts`, `dto/submit-contest-problem.dto.ts`.
  Chỉ `{ language, code }` trong body — `contestId`/`problemSlug` lấy từ route param, không trust client gửi kèm trong body (khác `/judge/submit` vốn flat theo `sessionId`).

- [x] **BE: route mới trong `contest.controller.ts`**
  📍 `server/src/modules/contest/contest.controller.ts`. Copy đúng pattern guard/decorator của `problems.controller.ts:24-29`.
  ```
  GET  /contests/:contestId/problems/:problemSlug        OptionalJwtAuthGuard
  POST /contests/:contestId/problems/:problemSlug/run    JwtAuthGuard, @Throttle 1 req/1.5s
  POST /contests/:contestId/problems/:problemSlug/submit JwtAuthGuard, @Throttle 1 req/5s
  ```
  Kiểm tra `contest.module.ts` có import `PrismaModule` tường minh chưa (hiện chưa có — chỉ chạy được nếu `PrismaModule` global, cần thêm nếu không).

- [x] **BE: test `contest.service.spec.ts` (module hiện chưa có test nào)**
  📍 `server/src/modules/contest/contest.service.spec.ts`, bám style mock của `judge.service.spec.ts` (mock `PrismaService`/`TestExecutionService` bằng `jest.fn()`, không đụng DB/Piston thật).
  - `deriveContestStatus`: test biên (trước start / trong khoảng / sau end).
  - `runContestProblem`/`submitContestProblem`: not-found, guard not-ONGOING (2 chiều, message khác nhau), ACCEPTED→penalty 0, không ACCEPTED→penalty 20, đúng payload `contestSubmission.create`, không emit event, `runContestProblem` không bao giờ ghi DB.
  - 1-2 test khoá lại hành vi hiện tại của `getLeaderboard` (module đang 0% coverage) trước khi các thay đổi xung quanh nó đụng vào.

- [x] **BE: dọn `seed-contests.ts` — xoá sạch data giả**
  📍 `server/prisma/seed-contests.ts`.
  - Xoá `upsertMockUsers()`, `MOCK_USERS`, `MOCK_PASSWORD`, toàn bộ logic fabricate `ContestSubmission` theo kịch bản — leaderboard bắt đầu **trống**, chỉ có data khi user thật nộp bài.
  - Thay logic chọn bài cố định bằng util `pickRandomProblemsByDifficulty` (xem task P1 bên dưới) — chỉ seed **1 contest mẫu** (không phải 2 như trước, vì không còn kịch bản leaderboard để "diễn"), `startTime` vài phút trước / `endTime` vài giờ sau để `deriveContestStatus()` đọc ra `ONGOING` ngay sau khi seed — dev mới clone repo chạy được full luồng list→detail→giải bài→nộp→leaderboard mà không cần setup tay.
  - Thêm bước promote 1 user seed sẵn có (vd user đầu tiên trong `seed.ts` chính) lên `role: 'ADMIN'` (upsert idempotent) để test API tạo contest (P1) mà không cần sửa tay DB. Log hint ra console sau khi seed xong.

- [ ] **FE: trang giải bài contest mới**
  📍 `client/src/features/contest/pages/contest-solve-page.tsx`, route `/contests/:contestId/problems/:problemSlug` đăng ký trong `client/src/app/router-instance.tsx` dưới block `ProtectedRoute` (cạnh `/interview/:slug`) — Run/Submit cần auth phía BE nên FE cũng gate ở đây.
  - Layout tham khảo `ResizablePanelGroup` của `interview-room.tsx` nhưng **bỏ hẳn** tab chat chiến lược, `useInterviewSocket`, panel AI evaluation, state khoá-theo-phase — đây là trang riêng cho thi tốc độ, không phải bản copy interview-room (đã chốt: contest bỏ qua Phase 1 hoàn toàn).
  - Component mới, feature-local theo `design.md` (không tái dùng component "shaped around session" của `interview`):
    - `components/contest-solve-header.tsx` — tên contest, chữ cái bài (A/B/C theo `order`) + điểm, nút Run/Submit, `ContestCountdown`, link quay lại.
    - `components/contest-problem-panel.tsx` — mô tả đề + sample test cases + độ khó/điểm.
    - `components/contest-console-panel.tsx` — 2 tab: Testcases (sample + kết quả Run) và Result (kết quả Submit gần nhất: status, số test pass/total, breakdown từng test).
  - **Tái dùng** `CodeEditorPanel` từ `@/features/interview/components/code-editor-panel.tsx` nguyên trạng — component này vốn đã generic (`code`/`language`/`isLocked`, không phụ thuộc session) nên đây là trường hợp hợp lệ duy nhất để tái dùng chéo feature.
  - `isLocked = true` khi status derived khác `ONGOING`; contest FINISHED vẫn mở được trang (đọc đề lại được) nhưng hiện banner "đã kết thúc" + khoá Run/Submit — không chặn hẳn route.

- [x] **FE: types/api/hooks cho luồng giải bài**
  📍 `client/src/features/contest/types/index.ts`, `api/contest-api.ts`, `hooks/use-contest-problem.ts`, `hooks/use-contest-judge.ts` (mirror `use-judge.ts` — mutation + toast).
  Thêm `getContestProblem`, `runContestCode`, `submitContestCode` vào `contest-api.ts`; types `ContestProblemDetail`, `ContestRunResult`, `ContestSubmissionResult`.

---

## 🟡 P1 — Admin tạo contest thật + Redesign UI

- [ ] **BE: util chọn bài random theo độ khó (pure function, dùng chung BE + seed script)**
  📍 `server/src/modules/contest/contest-problem-picker.util.ts` — không phụ thuộc Nest DI/Prisma Client, nhận vào `Problem[]` thuần để `seed-contests.ts` (script `PrismaClient` thuần, theo đúng tiền lệ `seed.ts`/`seed-quest.ts`/`seed-badges.ts`) gọi lại được cùng 1 thuật toán mà không cần bootstrap Nest app context.
  Thuật toán: Fisher-Yates shuffle + lấy N bài mỗi băng độ khó; nếu pool không đủ, throw kèm tên băng thiếu (dùng `strict: true` ở API admin, `strict: false` best-effort ở seed script để không crash DB dev còn ít bài).

- [ ] **BE: `POST /contests` — tạo contest admin-gated**
  📍 `server/src/modules/contest/contest.controller.ts` + `contest.service.ts`, copy đúng pattern `problems.controller.ts:24-29`.
  ```ts
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateContestDto) {
    return this.contestService.createContest(dto);
  }
  ```
  `CreateContestDto` (`dto/create-contest.dto.ts`): `title`, `description`, `startTime`/`endTime` (`@IsDateString`), `problemCounts: { easy, medium, hard }` (nested DTO, `@ValidateNested`).
  `createContest()`: slugify title (`ConflictException` khi trùng, mirror `problems.service.create`), validate `startTime < endTime`, gọi `pickRandomProblemsByDifficulty` theo từng băng độ khó yêu cầu, `$transaction` tạo `Contest` + `createMany` `ContestProblem` (điểm theo `POINTS_BY_DIFFICULTY`, `order` tuần tự theo Easy→Medium→Hard).
  Chưa cần UI admin — test qua curl/Postman bằng account đã promote ADMIN ở task seed (P0) là đủ cho giai đoạn này.

- [ ] **FE: redesign `contest-list-page.tsx`**
  📍 `client/src/features/contest/pages/contest-list-page.tsx`, `components/contest-card.tsx`.
  - Thêm `Tabs` (shadcn) Tất cả/Sắp diễn ra/Đang diễn ra/Đã kết thúc, filter client-side trên kết quả `useContests()` sẵn có.
  - Mở rộng `max-w-4xl` → `max-w-6xl`; `ContestCard` thêm `ContestCountdown`.
  - Không ép layout sidebar-widget kiểu `problems-page.tsx` (Calendar/TrendingCompanies) — chưa có widget nào tương ứng cho contest, ép vào chỉ tạo thêm khoảng trống rỗng. Có thể thêm 1 dải thống kê ngắn ("X cuộc thi · Y đang diễn ra") để đỡ trống thay vì sidebar giả.

- [ ] **FE: component `contest-countdown.tsx` dùng chung**
  📍 `client/src/features/contest/components/contest-countdown.tsx`. Tick client-side mỗi giây, props `{ startTime, endTime, status }` → "Bắt đầu sau HH:MM:SS" / "Kết thúc sau HH:MM:SS" / "Đã kết thúc". Dùng ở list card, detail page, header trang giải bài.

- [ ] **FE: redesign `contest-detail-page.tsx`**
  📍 `client/src/features/contest/pages/contest-detail-page.tsx`, `components/contest-leaderboard-table.tsx`.
  - `ContestCountdown` nổi bật dưới title/badge.
  - CTA chính đổi theo trạng thái: ONGOING → "Vào thi ngay"; UPCOMING → disabled, chỉ hiện countdown; FINISHED → nhấn mạnh hướng xuống leaderboard.
  - Dòng bài tập trở thành `Link` tới `/contests/:contestId/problems/:slug`, hiện chữ cái/title/độ khó/điểm + trạng thái đã giải (dấu tick nếu `myStatus.solved`, badge số lần thử nếu đã thử mà chưa giải) lấy thẳng từ response `findOne()` đã enrich — không cần round-trip riêng. Khoá + tooltip khi UPCOMING; vẫn click được (read-only) khi FINISHED.
  - `ContestLeaderboardTable`: highlight dòng của user hiện tại (so `entry.userId` với `useAuthStore`), style rank huy chương cho top 3 (icon `Medal`/`Trophy` từ lucide, theo đúng quy ước màu độ khó đã dùng trong app).

- [ ] **FE: fix link chết trong header**
  📍 `client/src/components/layout/dashboard-header.tsx:13` — `{ labelKey: "nav.contest", href: "#" }` → `href: "/contests"`.

- [ ] **i18n: bổ sung key mới cho 3 ngôn ngữ**
  📍 `client/src/lib/i18n/locales/{en,vi,ja}/contests.json`.
  Nhóm key mới: `tabs.*` (all/upcoming/ongoing/finished), `countdown.*` (startsIn/endsIn/ended), `cta.*` (enterContest/viewResults/solve), `problems.{solved,attempts,lockedUpcoming}`, `solve.*` (backToContest/run/submit/running/submitting/tabTestcases/tabResult/contestEndedBanner/contestNotStartedBanner/alreadySolvedHint/emptyCode), `leaderboard.you`. Key cũ (`status.*`, `difficulty.*`, `leaderboard.{title,rank,player,score,penalty,empty}`) giữ nguyên.

---

## 🟢 P2 — Mở rộng (ngoài scope hiện tại)

- [ ] **Admin Panel UI**: form tạo/sửa/xoá `Contest` thay thế việc gọi API tạo contest qua curl/Postman.
- [ ] **Chế độ luyện tập đầy đủ cho contest FINISHED**: hiện tại chỉ đọc-được-đề read-only; mở rộng thêm (vd cho phép "luyện tập" nộp bài không tính điểm/leaderboard sau khi kết thúc).
- [ ] **Đăng ký/roster contest chính thức**: hiện tại "ai đăng nhập cũng nộp được khi ONGOING" — nếu sau này cần danh sách người tham gia chính thức (giới hạn số lượng, xác nhận trước giờ thi...).
- [ ] **AI code-evaluation cho bài nộp trong contest**: hiện tại quyết định KHÔNG nối vào pipeline Gemini review (giữ tốc độ, tránh câu hỏi công bằng AI hỗ trợ giữa lúc thi) — nếu sau này đổi ý, cần wiring listener riêng vì `submission.accepted` hiện chỉ gắn với `Submission`/`Session`, không phải `ContestSubmission`.

---

## Ghi chú thứ tự ưu tiên

DB đi trước BE, BE đi trước FE — FE cần contract API thật để gọi. Trong P0, task tách `TestExecutionService` phải xong và pass full test `judge` + `contest` TRƯỚC mọi task Run/Submit khác vì mọi chấm bài của contest đều phụ thuộc service này. Task xoá data giả trong `seed-contests.ts` nên làm sau khi API Run/Submit đã có, để verify luôn bằng 1 lượt nộp bài thật thay vì chỉ xoá code rồi để đó.
