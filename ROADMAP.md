# 🗺️ AlgoMinds — Roadmap: Career Journey & AI-Native Features

> Bản roadmap trước (Quest "Bug Whacker") đã hoàn thành 100% (2026-08-03) — xem lịch sử git nếu cần tham chiếu lại nội dung cũ.
> Bản này thay thế nó. Xuất phát từ 1 phiên brainstorm sản phẩm (2026-08-05): AlgoMinds không muốn clone các tab kiểu LeetCode (Contest/Discuss/Explore/Study Plan/Store) — 5 tab đó vốn tách rời vì LeetCode không có gì kết nối chúng lại. AlgoMinds thì có: lớp AI evaluation (Gemini chấm chiến lược + code) chạy xuyên suốt `sessions`/`ai`/`chat`. Roadmap này gộp cả 5 tab đó thành **1 hệ thống duy nhất — "Career Journey"** — và bổ sung 3 tính năng hoàn toàn mới không tồn tại ở LeetCode.

## Triết lý điều hướng

```
Trước (dự định, LeetCode-style): Problems | Quest | Contest | Discuss | Explore | Study Plan | Store
Sau (roadmap này):                Problems | Quest | Career Journey
```

`Career Journey` là 1 pipeline mô phỏng quy trình xin việc thật (chọn mục tiêu → Phone Screen → Technical Rounds → Onsite Loop → Offer), mỗi vòng do 1 **AI persona** khác nhau đảm nhiệm. 5 tab cũ không biến mất — chức năng của chúng được hấp thụ vào đúng ngữ cảnh trong pipeline này thay vì làm tab rời:

| Tab cũ | Hấp thụ vào |
|---|---|
| Explore / Study Plan | "Vòng tiếp theo" — do AI Radar chọn từ lịch sử `Evaluation` thật, không phải danh sách/roadmap tĩnh để duyệt. |
| Contest | **Hiring Event** — khung giờ giới hạn, 1 track "mở tuyển", xếp hạng theo hiệu suất Phase 1 (không chỉ tốc độ code). |
| Discuss | **Offer Debrief** — AI tổng hợp cách người khác vượt qua đúng persona/stage đó, chỉ hiện sau khi user hoàn thành stage. |
| Store | **Career Resources** — persona mở khoá qua tiến trình (hoặc credits), không phải shop liệt kê sẵn. |

## Cách đọc file này
- `🔴 P0` — Nền tảng bắt buộc: data model + BE tối thiểu + FE thay được sidebar item hiện tại (`Explore`/`Study Plan` đang trỏ `href: "#"` — xem `client/src/components/layout/dashboard-sidebar.tsx`).
- `🟡 P1` — Persona thật + 3 cơ chế thay thế Contest/Discuss/Store.
- `🟢 P2` — Tính năng net-new (đã chốt ý tưởng ở phiên brainstorm, giữ nguyên tinh thần, không rút gọn).
- `🔵 P3` — Tính năng net-new phức tạp nhất, cần buổi thiết kế kỹ riêng trước khi code (2 user thật + AI quan sát viên trong cùng room).
- Mỗi task ghi **vị trí code** liên quan, và các chỗ đánh dấu **"cần quyết định sản phẩm"** — không tự ý giả định, hỏi lại user trước khi code (giống cách Quest P2 từng hỏi về việc có đụng `credits`/`streakDays` không).

---

## 🔴 P0 — Nền tảng Career Journey (data model + BE tối thiểu + thay sidebar)

- [x] **DB: model `InterviewerPersona` — cấu hình "tính cách" AI interviewer**
  📍 `server/prisma/schema.prisma`. Đây là nền cho toàn bộ Persona Marketplace lẫn Onsite Loop nhiều vòng khác persona.
  ```prisma
  enum PersonaTone {
    STRICT
    FRIENDLY
    SKEPTICAL
    LENIENT
  }

  model InterviewerPersona {
    id                String      @id @default(uuid())
    key               String      @unique // "google_strict", "startup_friendly" — đối chiếu code, không đổi khi dịch tên hiển thị
    name              String
    description       String
    tone              PersonaTone
    systemPromptExtra String      // đoạn chỉ dẫn NỐI VÀO systemInstruction gốc của AiService, không thay thế toàn bộ — giữ nguyên format JSON output bắt buộc
    unlockCost        Int         @default(0) // 0 = mặc định miễn phí (persona "Default" hiện tại)
    isActive          Boolean     @default(true)
    createdAt         DateTime    @default(now())

    @@map("interviewer_personas")
  }
  ```
  **Đã làm**: thêm đúng model như trên vào `schema.prisma`, chạy `npx prisma migrate dev --name add_interviewer_persona` (migration `20260805021146_add_interviewer_persona`, DB thật qua docker-compose, không dùng `db push`). Seed 1 persona `key: "default"` trong `seed.ts` với `systemPromptExtra: ""` (chuỗi rỗng) — cố ý để không nối thêm gì vào `systemInstruction` gốc của `AiService`, đảm bảo hành vi Phase 1 hiện tại không đổi khi tích hợp persona ở bước sau. `npx prisma generate` + `npx prisma db seed` + `npm run build` đều pass.

- [x] **BE: tham số hoá `AiService` theo persona — KHÔNG viết lại luồng đánh giá**
  📍 `server/src/modules/ai/ai.service.ts` (dòng 31-65, `this.model` với `systemInstruction` hardcode). Đổi thành: giữ nguyên khối JSON contract + quy tắc đánh giá cốt lõi (không đổi), chỉ nối thêm `persona.systemPromptExtra` vào cuối system instruction khi build request — vd persona "Google Strict" thêm đoạn "khắt khe hơn với độ phức tạp thời gian, không chấp nhận giải pháp brute-force dù đúng". Method nhận thêm `personaId?: string` (mặc định = persona "default" nếu không truyền — không đổi hành vi Phase 1 hiện tại của `sessions`/`chat` khi chưa tích hợp Career Journey).
  **Đã làm**: tách text `systemInstruction` gốc thành hằng số module-level `STRATEGY_SYSTEM_INSTRUCTION` (nội dung y hệt cũ, không sửa 1 chữ). `this.model` (build ở constructor) vẫn dùng đúng hằng số này — hành vi mặc định giữ nguyên 100%, không thêm Prisma round-trip khi không truyền `personaId`. Thêm `generateResponse(..., personaId?: string)` + private `resolveStrategyModel(personaId?)`: nếu không có `personaId` → trả thẳng `this.model` (no-op); nếu có → tra `InterviewerPersona` qua Prisma, build model mới với `STRATEGY_SYSTEM_INSTRUCTION + "\n\n" + persona.systemPromptExtra`, cache theo `personaId` trong `Map` để không gọi lại Gemini SDK/Prisma mỗi tin nhắn; nếu persona không tồn tại hoặc `systemPromptExtra` rỗng → fallback `this.model` (không chặn chat vì lỗi dữ liệu persona). `ai.processor.ts` (nơi gọi `generateResponse` duy nhất) chưa đổi — chưa truyền `personaId` vì `Session` chưa gắn persona (việc đó thuộc `CareerJourney`/`sessions.service.ts` ở bước sau), nên hành vi Phase 1 hiện tại của `sessions`/`chat` không đổi. `npm run build` + `npm run lint` (server) đều pass; chưa có `ai.service.spec.ts` sẵn có để đối chiếu regression.

- [x] **DB: model `CareerTrack` + `CareerTrackStage` — định nghĩa 1 "mục tiêu nghề nghiệp"**
  📍 `server/prisma/schema.prisma`.
  ```prisma
  model CareerTrack {
    id          String   @id @default(uuid())
    key         String   @unique // "senior_backend_startup", "newgrad_bigtech"
    name        String
    description String
    isActive    Boolean  @default(true)
    createdAt   DateTime @default(now())

    stages CareerTrackStage[]

    @@map("career_tracks")
  }

  enum StageKind {
    PROBLEM // vòng dùng luồng sessions hiện có (Phase1 → Phase2)
    QUEST   // vòng dùng mini-game Quest hiện có
  }

  model CareerTrackStage {
    id        String    @id @default(uuid())
    trackId   String
    order     Int       // thứ tự vòng trong track, 0-based
    label     String    // "Phone Screen", "Onsite - Round 1"...
    kind      StageKind
    problemId String?   // bắt buộc khi kind = PROBLEM
    personaId String
    createdAt DateTime  @default(now())

    track   CareerTrack         @relation(fields: [trackId], references: [id], onDelete: Cascade)
    problem Problem?            @relation(fields: [problemId], references: [id])
    persona InterviewerPersona  @relation(fields: [personaId], references: [id])

    @@unique([trackId, order])
    @@map("career_track_stages")
  }
  ```
  Track/stage là nội dung do đội ngũ định nghĩa trước (giống `Problem` — quản trị qua seed/admin API, không cần trang admin UI riêng ở giai đoạn này, đúng scope hiện tại của `problems`).
  **Đã làm**: thêm đúng `StageKind` enum + 2 model như trên, cộng 2 back-relation bắt buộc để Prisma validate quan hệ 2 chiều: `Problem.careerTrackStages CareerTrackStage[]` và `InterviewerPersona.stages CareerTrackStage[]` (chưa có ở item trước vì lúc đó `CareerTrackStage` chưa tồn tại). Chạy `npx prisma format` + `npx prisma validate` trước khi migrate để bắt lỗi quan hệ sớm. Migration `20260805021735_add_career_track_and_stage` áp trực tiếp vào DB dev qua docker-compose. `npx prisma generate` + `npm run build` pass (gặp 1 lần `ENOTEMPTY: directory not empty, rmdir dist` do file handle Windows còn giữ — build lại lần 2 qua ngay, không phải lỗi code).

- [x] **DB: model `CareerJourney` + `JourneyStageProgress` — tiến trình của 1 user trong 1 track**
  📍 `server/prisma/schema.prisma`. Đây là bảng điều phối mỏng nối vào `Session`/`QuestAttempt` đã có sẵn, KHÔNG thay đổi 2 bảng đó.
  ```prisma
  enum JourneyStatus {
    IN_PROGRESS
    PASSED
    FAILED
    ABANDONED
  }

  enum StageStatus {
    PENDING
    ACTIVE
    PASSED
    FAILED
  }

  model CareerJourney {
    id         String        @id @default(uuid())
    userId     String
    trackId    String
    status     JourneyStatus @default(IN_PROGRESS)
    startedAt  DateTime      @default(now())
    finishedAt DateTime?

    user     User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
    track    CareerTrack            @relation(fields: [trackId], references: [id])
    progress JourneyStageProgress[]

    @@index([userId, status])
    @@map("career_journeys")
  }

  model JourneyStageProgress {
    id             String      @id @default(uuid())
    journeyId      String
    stageId        String
    sessionId      String?     @unique // set khi stage.kind = PROBLEM
    questAttemptId String?     @unique // set khi stage.kind = QUEST
    status         StageStatus @default(PENDING)
    completedAt    DateTime?

    journey      CareerJourney    @relation(fields: [journeyId], references: [id], onDelete: Cascade)
    stage        CareerTrackStage @relation(fields: [stageId], references: [id])
    session      Session?         @relation(fields: [sessionId], references: [id])
    questAttempt QuestAttempt?    @relation(fields: [questAttemptId], references: [id])

    @@unique([journeyId, stageId])
    @@map("journey_stage_progress")
  }
  ```
  `SessionEvent` (audit trail append-only) không đổi — 1 session tạo ra trong ngữ cảnh Career Journey vẫn ghi event bình thường, `JourneyStageProgress` chỉ trỏ tới `sessionId` đã tồn tại.
  **Đã làm**: thêm đúng 2 enum + 2 model như trên, cộng các back-relation Prisma yêu cầu: `User.careerJourneys`, `CareerTrack.journeys`, `CareerTrackStage.progress`, và quan hệ 1-1 optional `Session.journeyProgress` / `QuestAttempt.journeyProgress` (không sửa field nào có sẵn trên 2 model đó, chỉ thêm field quan hệ mới). Migration `20260805021855_add_career_journey_and_stage_progress`. `npx prisma format` + `validate` trước khi migrate, `npx prisma generate` + `npm run build` pass. Tới đây toàn bộ data model P0 đã đủ để module `career` (item tiếp theo) implement business logic mà không cần đổi schema thêm.

- [x] **BE: module `career` mới**
  📍 `server/src/modules/career/` theo pattern NestJS chuẩn (dùng skill `add-nestjs-module`): `career.module.ts`, `career.controller.ts`, `career.service.ts`, `dto/`.
  - `GET /career/tracks` — danh sách track đang active.
  - `POST /career/tracks/:id/start` — tạo `CareerJourney` mới (hoặc resume nếu đã có `IN_PROGRESS`), tạo `JourneyStageProgress` cho stage đầu tiên (`status: ACTIVE`). Khi stage đầu là `PROBLEM`, gọi lại logic tạo `Session` hiện có trong `sessions.service.ts` (không viết lại — Career Journey chỉ điều phối, `sessions` vẫn là nguồn sự thật cho Phase 1/2) kèm `personaId` của stage.
  - `GET /career/journeys/me/active` — journey đang chạy + stage hiện tại, dùng cho FE hiển thị "vòng tiếp theo".
  - `POST /career/journeys/:id/advance` — gọi khi stage hiện tại `PASSED`/`FAILED` (`sessions` service emit event này khi session `COMPLETED`, xem `check-phase-flow.md` để tra cứu nhanh trạng thái session khi debug), tạo `JourneyStageProgress` cho stage kế tiếp hoặc đóng journey nếu hết stage.
  **Đã làm** (và 1 điều chỉnh scope so với mô tả gốc ở trên — giải thích bên dưới):
  - Tạo đủ 4 file theo convention: `career.module.ts` (imports `PrismaModule` + `SessionsModule`), `career.controller.ts` (toàn bộ route gate bằng `JwtAuthGuard`, giống `SessionsController`), `career.service.ts`, `dto/advance-journey.dto.ts`.
  - Reuse `Session` thật qua `SessionsService.findOrCreateBySlug(userId, problem.slug)` — **không** dùng `SessionsService.create()` (method đó hiện không được FE nào gọi và không trả về session đã tạo, nên đụng vào nó rủi ro hơn cần thiết cho phạm vi task này). Thêm `exports: [SessionsService]` vào `sessions.module.ts` (dòng duy nhất sửa trong module `sessions` — không đổi logic bên trong) để `CareerModule` import được.
  - **Phát hiện khi đọc code**: mô tả gốc ở trên giả định "`sessions` service emit event khi session `COMPLETED`" — nhưng grep toàn bộ `server/src` cho thấy **không có bất kỳ chỗ nào trong codebase hiện tại chuyển `Session.status` sang `COMPLETED` hoặc `ABANDONED`** (chỉ có transition `PHASE_1_STRATEGY` → `PHASE_2_IMPLEMENT` trong `ai.processor.ts`). Vì vậy `POST /career/journeys/:id/advance` **không** tự suy luận PASSED/FAILED từ trạng thái `Session`/`QuestAttempt` — nhận tường minh `{ status: "PASSED" | "FAILED" }` trong body (`AdvanceJourneyDto`, validate bằng `@IsIn`). Việc tự động hoá (session/quest hoàn thành → tự advance) là việc riêng, cần thêm cơ chế đánh dấu hoàn thành session trước — không tự ý thêm vào `sessions.service.ts` ở đây vì đó là thay đổi lớn hơn phạm vi 1 module coordinator.
  - `personaId` của stage: `CareerTrackStage.personaId` được include đầy đủ qua `TRACK_WITH_STAGES_INCLUDE`/`GET /career/tracks` để FE đọc, nhưng **chưa** được truyền vào `AiService.generateResponse()` trong `ai.processor.ts` — `Session` không có cột lưu persona nào để `processChat()` tra ngược lại. Đây là giới hạn đã biết, để lại cho bước tích hợp sâu hơn (nối `chat`/`ai` với `career`), không giả vờ đã xong.
  - Đăng ký `CareerModule` vào `app.module.ts`. Verify: `npm run build` + `npm run lint` (server) pass; boot thử `node dist/src/main.js` — toàn bộ 4 route `/career/*` map đúng, DI resolve sạch (không lỗi circular/module thiếu export), lỗi duy nhất là `EADDRINUSE :3000` vì đã có 1 instance dev khác đang chạy — không phải lỗi code.

- [x] **FE: thay sidebar item `Explore`/`Study Plan` bằng `Career Journey`**
  📍 `client/src/components/layout/dashboard-sidebar.tsx` — 2 item hiện có `{ icon: Compass, labelKey: "sidebar.explore", href: "#" }` và `{ icon: GraduationCap, labelKey: "sidebar.studyPlan", href: "#" }` (chưa nối route, y hệt tình trạng `Quest` trước khi làm roadmap trước) → gộp thành 1 item `{ icon: Compass, labelKey: "sidebar.career", href: "/career" }`.
  **Đã làm**: gộp đúng như trên, xoá import `GraduationCap` không còn dùng. Đổi key i18n ở cả 3 locale (`locales/{en,vi,ja}/common.json`): xoá `sidebar.explore`/`sidebar.studyPlan`, thêm `sidebar.career` ("Career Journey" / "Hành trình sự nghiệp" / "キャリアジャーニー"). Route `/career` **chưa tồn tại** ở bước này — item sidebar sẽ 404 cho tới khi item cuối (trang pipeline + đăng ký route) hoàn thành, đúng thứ tự roadmap đã định (scaffold trước, trang sau). `npm run lint` + `npm run build` (client, gồm `tsc -b`) đều pass — warning duy nhất là 8 warning có sẵn từ trước trong `interview-room.tsx`, không liên quan thay đổi này.

- [x] **FE: scaffold feature folder `career`**
  📍 `client/src/features/career/` (dùng skill `add-frontend-feature`, convention `api/hooks/components/pages/types`).
  - `types/index.ts` — `CareerTrack`, `CareerJourney`, `JourneyStageProgress`, `StageKind`.
  - `api/career-api.ts` — `getTracks()`, `startTrack(trackId)`, `getActiveJourney()`, `advanceJourney(journeyId)`.
  - `hooks/use-career-tracks.ts`, `use-active-journey.ts` — bọc TanStack Query.
  **Đã làm**: tạo đúng 3 thư mục trên (chưa tạo `components/`/`pages/` — để dành cho item cuối, không tạo thư mục rỗng "phòng hờ" theo `design.md`). `types/index.ts` khớp sát response thật của `career.service.ts`: phát hiện 1 điểm không đối xứng đáng lưu ý khi đối chiếu code — `CareerTrack.stages[]` (từ `GET /career/tracks`, `/journeys/me/active`) có `persona`/`problem` được JOIN đầy đủ, nhưng `JourneyStageProgress.stage` (từ field `progress[]` trả về bởi `startTrack`/`advanceJourney`) chỉ là record thô không JOIN — nên định nghĩa `persona?`/`problem?` là optional thay vì bắt buộc, tránh FE giả định sai rồi crash khi đọc `stage.persona.name` ở nhánh dữ liệu không JOIN. Chưa thêm hook mutation `use-start-track.ts`/`use-advance-journey.ts` — để làm cùng lúc với trang pipeline (item tiếp theo) vì đó là nơi chúng thực sự được dùng, tránh scaffold hook chưa ai gọi. `npm run lint` + `npm run build` (client) pass, cùng 8 warning có sẵn không liên quan.

- [x] **FE: trang pipeline chính**
  📍 `client/src/features/career/pages/career-journey-page.tsx`, route `/career`. UI dạng timeline dọc (không phải grid duyệt bài như `problems-page.tsx`) — mỗi node là 1 stage với trạng thái `PENDING`/`ACTIVE`/`PASSED`/`FAILED`, node `ACTIVE` có nút vào làm (route tới `interview-room` hiện có nếu `kind = PROBLEM`, tới `/quest` nếu `kind = QUEST`).
  **Đã làm**: trang có 2 view — chưa có journey `IN_PROGRESS` thì hiện grid chọn track (`useCareerTracks`, nút "Start track" gọi `useStartTrack`); có journey thì hiện timeline dọc (border-left làm trục, dot màu theo status) build từ `journey.track.stages[]` đối chiếu `journey.progress[]` theo `stageId`. Đăng ký route `career` trong `router-instance.tsx` (cùng nhóm `DashboardLayout` với `problems`/`quest`). Thêm namespace i18n `career` (file mới `locales/{en,vi,ja}/career.json`, đăng ký vào `lib/i18n/index.ts`) — không tái dùng `common.json` vì đây là text riêng của feature, đúng convention `design.md`. Thêm hook mutation `use-start-track.ts` (còn thiếu từ item scaffold trước).
  **Bug phát hiện khi test tay** (không phải chỉ đọc code): `career.service.ts#startTrack()` trả `CareerJourney` chỉ với `include: { progress: { include: { stage: true } } }` — **thiếu `track`** — trong khi `getActiveJourney()` luôn include `track.stages` đầy đủ. FE mutation `useStartTrack` ghi thẳng response này vào cache `["career-journey-active"]` (dùng chung key với `useActiveJourney`), nên bấm "Start track" xong trang render trắng (thiếu `journey.track`) cho tới khi có refetch khác ghi đè. Bắt được lỗi này bằng cách tự tạo 1 track tạm qua script, đăng nhập test, bấm thật trong Chrome — không phải chỉ đọc code. Fix: gộp include thành 1 hằng số `JOURNEY_FULL_INCLUDE` (`track.stages` + `progress.stage`) dùng nhất quán cho **toàn bộ** điểm trả `CareerJourney` ra ngoài (`startTrack` cả nhánh resume/tạo mới, `getActiveJourney`, và cả 3 nhánh của `advanceJourney` — FAILED/hết-stage-PASSED/tạo stage kế tiếp), không chỉ chỗ vừa phát hiện lỗi.
  **Verify thật trong Chrome** (không chỉ build pass): tạo track tạm qua script Prisma trực tiếp (`Manual QA Track`, 2 stage: 1 `PROBLEM` trỏ `two-sum` + 1 `QUEST`), đăng ký tài khoản test qua UI, đăng nhập, vào `/career` → thấy đúng "No career tracks..." khi chưa có track (trước khi seed) → sau khi seed thấy card track + "2 stages" → bấm "Start track" → sau fix, timeline hiện đúng "Phone Screen" (ACTIVE, có tên bài + tên interviewer) và "Quest Round" (Locked) → bấm "Enter stage" → điều hướng đúng sang `/interview/two-sum`, trang interview room load bình thường. Không có console error trong suốt flow. Đã xoá sạch track/journey/user test sau khi verify xong — không phải seed data thật. `npm run lint` + `npm run build` (cả client và server, sau fix) đều pass.

---

## 🟡 P1 — 3 cơ chế thay thế Contest / Discuss / Store

- [ ] **DB+BE: `HiringEvent` — thay thế Contest**
  📍 `server/prisma/schema.prisma` model mới:
  ```prisma
  model HiringEvent {
    id        String   @id @default(uuid())
    trackId   String
    opensAt   DateTime
    closesAt  DateTime
    createdAt DateTime @default(now())

    track    CareerTrack @relation(fields: [trackId], references: [id])
    entries  CareerJourney[] // journey nào gắn eventId thì tính là "đã nộp đơn" event này

    @@map("hiring_events")
  }
  ```
  `CareerJourney` thêm field optional `eventId String?`. Xếp hạng (`GET /career/events/:id/leaderboard`) tính theo: số stage `PASSED`, tổng số lượt chat Phase 1 tới lúc `APPROVED` (đếm `Message` theo `sessionId` — càng ít lượt càng cao điểm, đúng tinh thần "thuyết phục interviewer nhanh hơn" đã brainstorm), tổng thời gian hoàn thành journey.

- [ ] **BE: job nền "Offer Debrief" — thay thế Discuss**
  📍 module mới `server/src/modules/career/` thêm `career.processor.ts` (theo đúng pattern `ai.processor.ts` — BullMQ worker, queue riêng `debrief-queue` khai báo qua `QueueModule`). Trigger khi `JourneyStageProgress.status` chuyển `PASSED`/`FAILED` cho stage `kind = PROBLEM`: gom các `Session.strategyAnswer` đã `APPROVED` khác của cùng `problemId`, gọi Gemini tổng hợp "N hướng tiếp cận khác nhau + trade-off" — **không** phải job chạy mỗi lần user xem, mà cache kết quả (model mới `StageDigest { stageId, content, generatedAt }`, tái tạo định kỳ khi đủ dữ liệu mới, không phải theo request).
  FE: hiện digest ngay trên màn "hoàn thành stage" (`career-journey-page.tsx` hoặc dialog kết quả), không phải 1 trang forum riêng để duyệt.

- [ ] **DB+BE: mở khoá persona — thay thế Store**
  📍 model mới `UserPersonaUnlock { userId, personaId, unlockedAt }` (`@@unique([userId, personaId])`). `POST /career/personas/:id/unlock`.
  **Cần quyết định sản phẩm trước khi code** (giống cách Quest P2 từng hỏi về `credits`/`streakDays` rồi quyết định không đụng): Career Journey có nên là nơi `UserStats.credits` chính thức có tác dụng không? 2 hướng:
  1. Mở khoá persona hoàn toàn qua tiến trình (vượt qua 1 track có persona X → tự động unlock, dùng lại ở track khác) — không đụng `credits`.
  2. Mở khoá bằng cách trừ `credits` trực tiếp (`server/src/modules/users/`) — biến `credits` từ số lượt free thành đơn vị kinh tế thật trong app.
  Không tự ý chọn — hỏi lại user khi bắt đầu implement mục này.

---

## 🟢 P2 — Tính năng net-new (không có ở LeetCode)

- [ ] **BE: `GET /sessions/:id/replay` — Interview Replay & Weakness Reel**
  📍 `server/src/modules/sessions/`. Compose lại theo thời gian: `SessionEvent` (transition) + `Message` (nội dung chat Phase 1) + `Evaluation` (điểm/feedback) thành 1 timeline duy nhất, đánh dấu rõ đoạn nào AI phát hiện lỗ hổng chiến lược. Không cần Gemini call mới — thuần đọc dữ liệu đã có sẵn 3 bảng này.
  FE: `client/src/features/interview/` (hoặc `career`) thêm trang replay, tái dùng cách render message hiện có trong `interview-room.tsx` (đọc component chat panel hiện tại trước khi viết mới — không tạo renderer riêng).

- [ ] **DB+BE: Confidence Calibration Score**
  📍 `server/src/modules/ai/ai.service.ts` — mở rộng JSON contract của Model 1 (Phase 1 Strategy Evaluation, dòng 41-45 hiện tại `{ "status", "message" }`) thêm field `"confidenceSignal": "hedging" | "neutral" | "assertive"` (Gemini tự đánh giá dựa trên cách ứng viên diễn đạt — không đổi 2 field `status`/`message` hiện có để không phá contract cũ).
  `Session` thêm field `confidenceSignal String?` để lưu lại. Aggregate xu hướng theo thời gian: so sánh `confidenceSignal` các session với `SubmissionStatus`/`Evaluation.scores` tương ứng — dùng để phát hiện lệch pha "tự tin thái quá nhưng sai" hay "đúng nhưng thiếu tự tin". Hiển thị ở `client/src/features/users/pages/profile-page.tsx`, card mới cạnh `badges-card.tsx`.

---

## 🔵 P3 — Live Co-Interview Mode

> Phức tạp và rủi ro nhất trong roadmap này — đụng trực tiếp `chat.gateway.ts` (đã có `forwardRef()` cycle với `AiModule`, xem `.claude/rules/workflow.md` mục "forwardRef() — không tự ý fix") và hiện **chưa có `.spec.ts` nào che phủ** module `chat`. Cần 1 buổi thiết kế kỹ riêng (role model, quyền truy cập room, cách AI "quan sát" mà không chặn luồng `send_message` hiện có) trước khi code, không nhảy thẳng vào implement từ mục này.

- [ ] **Thiết kế (chưa code): role thứ 2 trong 1 session room**
  📍 `server/src/modules/chat/chat/chat.gateway.ts` — hiện `join_room` (dòng 108) chỉ cho phép đúng `session.userId` join. Cần mở rộng: 1 session có thể có `role: "CANDIDATE" | "PEER_INTERVIEWER"`, AI chuyển từ vai "giám khảo duyệt/từ chối chiến lược" sang "quan sát viên" — không chặn Phase 1 → Phase 2 nữa mà để `PEER_INTERVIEWER` (người thật) quyết định, AI chỉ chấm ngầm sau khi xong.
  **Cần quyết định sản phẩm**: session kiểu này có tính là `Session` bình thường (đi qua state machine `PHASE_1_STRATEGY` → `PHASE_2_IMPLEMENT` hiện có) hay cần 1 loại session riêng? Ảnh hưởng trực tiếp tới `sessions.service.ts` — đọc kỹ `.claude/rules/workflow.md` mục "Luồng phiên phỏng vấn" trước khi quyết.

- [ ] **BE: chấm điểm 2 chiều sau buổi peer interview**
  📍 `server/src/modules/ai/` — thêm 1 evaluation model thứ 3 (giống cách `evaluationModel` tách riêng khỏi `model` ở P1 Strategy hiện tại), input là toàn bộ `Message[]` của session, output chấm cả `candidate` (giải thích rõ không) và `peerInterviewer` (hỏi follow-up có chất lượng không).

---

## Ghi chú thứ tự ưu tiên

DB → BE → FE trong từng nhóm P, giữ đúng lý do đã áp dụng ở roadmap Quest: FE cần contract API thật để gọi, tránh mock rồi sửa lại. `Career Journey` (P0-P1) đi trước 2 tính năng net-new đơn giản hơn (P2) vì P2 phụ thuộc dữ liệu `Session`/`Evaluation` đã tồn tại sẵn — không phụ thuộc P0, có thể làm song song nếu cần, nhưng đặt sau P0-P1 vì P0-P1 là thay đổi cấu trúc điều hướng lớn hơn, nên ưu tiên chốt trước khi tinh chỉnh thêm. P3 luôn đứng cuối vì đụng vào phần hạ tầng rủi ro nhất (`chat.gateway.ts` + `forwardRef()` cycle + chưa có test coverage).
