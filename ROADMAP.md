# 🗺️ AlgoMinds — Roadmap: Quest "Bug Whacker"

> Bản roadmap trước (audit 2026-08-01, luồng judge + profile dropdown) đã hoàn thành 100% — xem lịch sử git nếu cần tham chiếu lại nội dung cũ.
> Bản này thay thế nó, lên kế hoạch triển khai **Quest — Bug Whacker**: mini-game "tìm dòng code có bug trong thời gian giới hạn", gắn vào mục "Quest" đã có sẵn (nhưng chưa nối route) trên sidebar.

## Cách đọc file này
- `🔴 P0` — Lõi bắt buộc: không có thì game không chơi được (DB + API tối thiểu + FE chơi được 1 ván end-to-end).
- `🟡 P1` — Trải nghiệm & tích hợp: làm game "đàng hoàng", khớp UI/UX chuẩn của app, chống gian lận điểm cơ bản.
- `🟢 P2` — Mở rộng: gamification sâu (badge thật, leaderboard), mở rộng nội dung.
- Mỗi task ghi **vị trí code** liên quan để bắt tay vào làm ngay, và **vì sao** thứ tự này (phụ thuộc lẫn nhau ra sao).

---

## 🔴 P0 — Lõi (chơi được 1 ván end-to-end)

- [x] **DB: model `BugSnippet` — ngân hàng câu hỏi**
  Bảng chứa các đoạn code mẫu, mỗi bản ghi có đúng 1 dòng chứa bug.
  📍 `server/prisma/schema.prisma` (thêm cạnh các model hiện có, không đụng `Session`/`SessionEvent`).
  Repo đã có sẵn `enum Difficulty { EASY MEDIUM HARD }` dùng cho `Problem.difficulty` — tái dùng lại thay vì tạo thêm `QuestDifficulty` trùng giá trị (tránh 2 enum cùng ý nghĩa).
  ```prisma
  model BugSnippet {
    id          String     @id @default(uuid())
    language    String     // "javascript" | "python" | "java" — khớp PistonService.getLanguageConfig()
    difficulty  Difficulty
    code        String     // toàn bộ đoạn code (nhiều dòng)
    buggyLine   Int        // index dòng chứa bug, 0-based, tách theo "\n"
    explanation String?    // hiện sau khi trả lời, giải thích bug là gì
    isActive    Boolean    @default(true) // để tắt câu hỏi lỗi mà không xoá (giữ lịch sử QuestAttempt tham chiếu được)
    createdAt   DateTime   @default(now())

    @@index([language, difficulty, isActive])
    @@map("bug_snippets")
  }
  ```
  Dùng skill `add-prisma-model` để chạy migration đúng quy trình repo (không tự tay viết SQL migration).

- [x] **DB: model `QuestAttempt` — kết quả mỗi ván chơi**
  📍 `server/prisma/schema.prisma`.
  ```prisma
  model QuestAttempt {
    id           String     @id @default(uuid())
    userId       String
    difficulty   Difficulty
    score        Int
    correctCount Int
    wrongCount   Int
    bestCombo    Int
    durationMs   Int
    createdAt    DateTime   @default(now())

    user User @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId, createdAt])
    @@map("quest_attempts")
  }
  ```
  Cần thêm quan hệ ngược `questAttempts QuestAttempt[]` vào `model User`.

- [x] **DB: seed dữ liệu mẫu**
  📍 File mới `server/seed-quest.ts` (theo pattern `server/sync-problems.ts` đã có — script riêng, không nhét vào `prisma/seed.ts` để tránh chạy lại làm trùng dữ liệu mỗi lần `db seed`).
  Tối thiểu 5 snippet/độ khó × 3 độ khó × 3 ngôn ngữ ưu tiên (`javascript`, `python`, `java` — 3 ngôn ngữ đơn giản, dễ đọc nhanh trong game timed, đã được `PistonService` hỗ trợ sẵn nên không lệch với phần judge chính) = tối thiểu ~45 câu để không lặp quá nhanh.

- [x] **BE: module `quest` mới**
  📍 `server/src/modules/quest/` theo đúng pattern NestJS trong repo (dùng skill `add-nestjs-module`): `quest.module.ts`, `quest.controller.ts`, `quest.service.ts`, `dto/`.
  - `GET /quest/snippets?difficulty=&language=&count=` — trả về N snippet ngẫu nhiên (ẩn field `buggyLine`/`explanation` khỏi response, chỉ trả về sau khi FE submit đáp án của từng câu — tránh xem trước DevTools Network tab).
  - `POST /quest/snippets/:id/answer` — body `{ selectedLine: number }`, trả về `{ correct: boolean, buggyLine: number, explanation?: string }`. Endpoint riêng biệt (không gộp vào GET) chính là chỗ chặn gian lận score ở P1.
  - `POST /quest/attempts` — lưu kết quả tổng kết 1 ván, gắn `JwtAuthGuard` + `@CurrentUser()` (không tự parse JWT thủ công, theo `tech-defaults.md`).
  - `GET /quest/attempts/me?limit=` — lịch sử chơi của user hiện tại (dùng cho FE hiển thị "lần chơi gần nhất" trên Quest Hub).

- [x] **FE: scaffold feature folder `quest`**
  📍 `client/src/features/quest/` — dùng skill `add-frontend-feature` để đúng convention `api/hooks/components/pages/types/utils` như `design.md` mô tả.
  - `types/index.ts` — `QuestDifficulty`, `BugSnippetPublic` (không có `buggyLine`), `QuestAttemptResult`.
  - `api/quest-api.ts` — `getSnippets()`, `submitAnswer(id, selectedLine)`, `submitAttempt(payload)`, `getMyAttempts()`.
  - `hooks/use-quest-snippets.ts`, `use-submit-quest-attempt.ts` — bọc TanStack Query quanh `api/`.

- [x] **FE: Zustand store cho phiên chơi (client/UI state, không phải server state)**
  📍 `client/src/features/quest/stores/use-quest-session-store.ts` (hoặc `client/src/stores/` nếu muốn dùng chung — nhưng vì dữ liệu chỉ thuộc feature `quest`, nên đặt trong feature theo đúng tinh thần `design.md`: "không tự ý tạo store Zustand mới cho dữ liệu server-driven" — đây là state cục bộ của ván chơi, không phải dữ liệu server nên hợp lệ).
  Quản lý: `currentSnippetIndex`, `score`, `combo`, `lives`, `timeLeftMs`, `status: 'idle' | 'playing' | 'finished'`.

- [x] **FE: component chơi chính — "Line Sweeper"**
  📍 `client/src/features/quest/components/bug-whacker-board.tsx`.
  Hiển thị đoạn code (tái dùng cách render của `client/src/features/interview/components/problem-panel/code-block.tsx`: `<pre><code>` + `font-mono`, KHÔNG thêm lib syntax-highlight mới — repo hiện chưa có shiki/prism, giữ tối giản) + lưới ô tương ứng số dòng, click ô = chọn dòng đó là bug.

- [x] **FE: màn chọn độ khó + route `/quest`**
  📍 `client/src/features/quest/pages/quest-hub-page.tsx` + router (tìm nơi khai báo route chính, theo pattern `interview-room.tsx`).
  Đổi `client/src/components/layout/dashboard-sidebar.tsx` dòng `{ icon: Swords, labelKey: "sidebar.quest", href: "#" }` → `href: "/quest"` (mục sidebar đã có sẵn, chỉ cần nối route — không cần thêm UI nav mới).

---

## 🟡 P1 — Trải nghiệm & tích hợp chuẩn app

- [x] **FE: `QuestResultDialog` — tổng kết ván chơi**
  📍 `client/src/features/quest/components/quest-result-dialog.tsx`. Không có sẵn dialog kết quả nào trong repo để tái dùng — kết quả submission hiện hiển thị inline (`client/src/features/interview/components/console-panel/result-accepted.tsx` + `result-stats-cards.tsx`, không phải modal). Tái dùng token/pattern trình bày số liệu (`bg-card border border-border rounded-lg p-4`, `text-2xl font-semibold`) của `result-stats-cards.tsx` cho phần thẻ điểm số, dựng trong shadcn `Dialog` có sẵn (`client/src/components/ui/dialog.tsx`). Hiện điểm, đúng/sai, best combo, nút "Chơi lại" / "Về Quest Hub".

- [x] **FE: hiệu ứng feedback tức thời**
  📍 trong `bug-whacker-board.tsx`. Ô đúng flash `bg-emerald-500/20`, ô sai flash `bg-destructive/20` (dùng token màu Tailwind/shadcn có sẵn, không hardcode hex mới — theo `design.md`). Thanh thời gian dạng progress bar đổi `bg-primary` → `bg-destructive` khi còn < 20%, giống pattern cảnh báo đã dùng ở `console-panel`.

- [x] **BE: chặn gian lận điểm ở tầng validate**
  📍 `server/src/modules/quest/dto/create-attempt.dto.ts` + `quest.service.ts`. `class-validator` giới hạn: `score` không vượt quá `correctCount × điểm-tối-đa-mỗi-câu-theo-difficulty`, `durationMs` tối thiểu hợp lý theo `correctCount + wrongCount` (không thể trả lời nhanh hơn X ms/câu). Đây là lý do endpoint `POST /quest/snippets/:id/answer` phải tách riêng ở P0 thay vì để FE tự tính điểm và chỉ gửi tổng kết — server phải là nguồn xác nhận "đúng/sai" cho từng câu.

- [x] **i18n: `quest.json` cho 3 ngôn ngữ**
  📍 `client/src/lib/i18n/locales/{en,vi,ja}/quest.json`, theo đúng pattern file hiện có (`interview.json`, `users.json`). Namespace `t("quest.xxx")` dùng `useTranslation("quest")` giống các feature khác.

- [x] **FE: responsive mobile cho lưới**
  📍 `bug-whacker-board.tsx` — `grid-cols-1` mobile, layout dòng-code dọc thay vì lưới vuông (vì mỗi ô tương ứng 1 dòng code dài, không phải ô vuông Minesweeper thật).

- [x] **BE+FE: hiển thị lịch sử Quest trên profile**
  📍 `server/src/modules/quest/quest.controller.ts` (`GET /quest/attempts/me` đã có ở P0) → nối vào `client/src/features/users/pages/profile-page.tsx`, thêm card mới cạnh `recent-submissions-card.tsx` (không sửa card đó — Quest là data riêng, không phải judge submission).

---

## 🟢 P2 — Mở rộng gamification

- [x] **DB+BE: model `Badge` thật — thay `MOCK_BADGE`**
  📍 `client/src/features/users/components/badges-card.tsx` hiện có comment `// TODO: Requires backend schema — no Badge model exists yet, stays mocked.` và dùng `MOCK_BADGE` từ `client/src/features/users/utils/mock-data.ts`. Đây là cơ hội tự nhiên để làm nó thật, gắn rule "đạt X điểm/combo trong Quest → mở khoá badge".
  ```prisma
  model Badge {
    id          String   @id @default(uuid())
    name        String
    description String
    iconKey     String   // map sang lucide-react icon ở FE, không lưu SVG blob
    createdAt   DateTime @default(now())
  }

  model UserBadge {
    id       String   @id @default(uuid())
    userId   String
    badgeId  String
    earnedAt DateTime @default(now())

    user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
    badge Badge @relation(fields: [badgeId], references: [id], onDelete: Cascade)

    @@unique([userId, badgeId])
    @@map("user_badges")
  }
  ```
  Earning-rule logic đặt trong `quest.service.ts` khi lưu `QuestAttempt` (check ngưỡng score/combo → tạo `UserBadge` nếu chưa có).

  Đã triển khai với 1 điều chỉnh so với schema gợi ý: thêm field `Badge.key` (unique, machine-stable) — cần 1 định danh ổn định để `BADGE_RULES` trong `quest.service.ts` và `server/seed-badges.ts` đối chiếu, tách khỏi `name` (text hiển thị, có thể đổi/dịch). 5 badge khởi tạo: `first_attempt`, `combo_5`, `perfect_run`, `hard_master`, `speed_runner`. Endpoint mới `GET /quest/badges/me` cấp dữ liệu cho `badges-card.tsx` (đã bỏ `MOCK_BADGE`). Verify bằng flow HTTP thật (register → login → POST /quest/attempts → GET /quest/badges/me) qua user throwaway, xác nhận đúng 4/5 badge ăn ở ván EASY hoàn hảo, thêm `hard_master` ở ván HARD hoàn hảo, không trùng lặp UserBadge ở lần gọi lại — sau đó xoá user test.

- [x] **BE: `GET /quest/leaderboard?difficulty=`**
  📍 `quest.service.ts` — top N `QuestAttempt.score` theo difficulty, join `User` lấy tên hiển thị.

  Dedupe theo user (lấy điểm cao nhất mỗi user, không phải top N attempt) để 1 người chơi nhiều ván không chiếm hết bảng — dùng `groupBy` lấy `_max.score` mỗi `userId`, sau đó join `QuestAttempt` + `User` để lấy `bestCombo`/`achievedAt`/tên hiển thị đúng của lượt đạt điểm đó. Verify qua HTTP thật với 2 user throwaway: user chơi 2 ván (40 rồi 90 điểm) chỉ xuất hiện 1 dòng với điểm 90, sắp xếp đúng thứ tự giảm dần.

- [x] **FE: leaderboard UI trong Quest Hub**
  📍 `quest-hub-page.tsx`, tab hoặc card riêng cạnh nút "Bắt đầu chơi".

  `quest-leaderboard-card.tsx` — card riêng dưới lưới độ khó, dùng shadcn `Tabs` để chuyển độ khó (mặc định EASY), `Avatar` cho từng người chơi. Verify bằng claude-in-chrome thật trên `/quest`: chuyển tab Dễ/Trung bình/Khó cập nhật đúng dữ liệu, tab chưa có điểm nào hiện đúng empty state.

- [x] **Content: mở rộng ngân hàng câu hỏi + script quản lý**
  📍 mở rộng `server/seed-quest.ts` theo pattern `server/sync-problems.ts` (script sync riêng, chạy thủ công khi cần thêm nội dung — không cần trang admin UI riêng ở giai đoạn này, giữ đơn giản đúng scope hiện tại của `problems` module vốn cũng quản trị qua seed/admin API, không phải qua UI).

  "Script quản lý" chính là `seed-quest.ts` hiện có (idempotent, upsert-by-code) — không cần script/trang riêng. Thêm 5 concept bug mới mỗi độ khó (× 3 ngôn ngữ = 45 snippet mới), gấp đôi ngân hàng từ 45 → 90 (30/độ khó, 30/ngôn ngữ). Verify: chạy seed thật vào dev DB (45 created, 45 already present — không trùng lặp), kiểm tra phân bố qua Prisma, và chơi thử 1 snippet mới (`contains_duplicate`, Python) qua claude-in-chrome — chọn đúng dòng bug hiện đúng feedback/explanation.

- [x] **BE+FE: (tuỳ chọn, cần quyết định sản phẩm) tích hợp `UserStats.credits`/`streakDays`**
  📍 `server/src/modules/users/*`. Quyết định: chơi Quest có trừ `credits` không, thắng ván tốt có cộng `streakDays` không. Để P2 vì đây là quyết định sản phẩm, không phải kỹ thuật — làm sau khi core game đã chơi ổn.

  **Quyết định (2026-08-03, hỏi trực tiếp user): không tích hợp.** Quest giữ nguyên là mini-game miễn phí, tách biệt hoàn toàn khỏi `credits`/`streakDays` của luồng phỏng vấn chính — không có thay đổi code nào cho mục này.

---

## 🔵 P3 — Chọn ngôn ngữ + UI "game menu" + gameplay juice

> Bổ sung sau khi chơi thử P0-P2 thật: (1) không chọn được ngôn ngữ dù backend đã hỗ trợ sẵn qua `?language=`, (2) màn chọn độ khó chưa có cảm giác "menu game" (bấm là chơi luôn, không có bước "chọn rồi bấm Play"), (3) gameplay còn phẳng — feedback chỉ đổi màu, không có escalation/celebration. Quyết định phạm vi (hỏi trực tiếp user trước khi lên kế hoạch): có tuỳ chọn "Ngẫu nhiên" trong bộ chọn ngôn ngữ; thêm `canvas-confetti` (~5kb) cho hiệu ứng ăn mừng; **không** làm âm thanh ở P3 (cần asset ngoài, để sau); hiển thị "mở khoá badge mới" ngay trong màn kết quả.

- [x] **FE: bộ chọn ngôn ngữ nối end-to-end**
  📍 `client/src/features/quest/types/index.ts` (thêm `QuestLanguage`), `stores/use-quest-session-store.ts` (`startGame` nhận thêm `language: QuestLanguage | null`, `null` = Ngẫu nhiên), `pages/quest-hub-page.tsx` (truyền `language` vào `useQuestSnippets`). Backend đã sẵn sàng (`quest.service.ts#getRandomSnippets` đã filter theo `language` query param từ P0) — không cần đổi gì ở server.

  Chỉ phần "plumbing" (types/store/hook) — chưa có UI để chọn ngôn ngữ (`handleStart` nhận `chosenLanguage` optional, mặc định `null`/Ngẫu nhiên, các nút hiện tại chưa truyền giá trị khác). UI chọn thật ở mục "game menu" ngay dưới đây — verify E2E bằng browser sẽ làm ở đó vì cần UI mới tồn tại trước.

- [x] **FE: dựng lại màn setup thành "game menu" thật (chọn → bấm Play)**
  📍 `client/src/features/quest/components/quest-setup-panel.tsx` (component mới) — 2 hàng `Tabs` (độ khó + ngôn ngữ, tái dùng pattern từ `quest-leaderboard-card.tsx`), bấm tab chỉ để *chọn* (không tự chơi), 1 nút "▶ Chơi" lớn ở giữa mới thực sự gọi `startGame`. `quest-hub-page.tsx` thay khối 3 card hiện tại bằng component này.

  Verify bằng claude-in-chrome thật với user throwaway: chọn Python + Dễ, bấm Play, xác nhận 3 câu liên tiếp đều là Python (trước đó pool ngẫu nhiên trộn cả 3 ngôn ngữ) — hoàn thành luôn phần verify còn thiếu của mục ngôn ngữ ở trên vì cần UI này mới test được thật.

- [ ] **FE: gameplay juice — micro-interaction, không thêm dependency**
  📍 `client/src/app/index.css` (thêm `@keyframes shake`, `@keyframes pop-in` — file hiện chưa có custom keyframes nào), áp dụng vào `bug-whacker-board.tsx` (dòng sai rung, dòng đúng pop-in), `quest-hub-page.tsx` (combo ≥ 5 đổi icon `Flame` màu cam, số điểm "+N" nổi lên khi trả lời đúng, thanh thời gian thêm `animate-pulse` khi dưới 20%, toast mừng mốc combo qua `sonner` — hiện chỉ dùng `toast.error` trong quest, chưa có `toast.success`).

- [x] **BE+FE: hiển thị "mở khoá badge mới" trong màn kết quả**
  📍 `quest.service.ts#awardBadges` trả về danh sách badge mới thật sự vừa mở khoá (thay vì fire-and-forget `createMany`), `createAttempt` gắn vào response thành `newBadges`. FE: `QuestAttemptResult` thêm field `newBadges: EarnedBadge[]`, `quest-hub-page.tsx` đọc từ `onSuccess` của `submitAttempt`, `quest-result-dialog.tsx` hiện banner "🎉 Mở khoá huy hiệu mới" khi có.

  `awardBadges` giờ query trước những badge user đã có (thay vì chỉ dựa vào `skipDuplicates` của `createMany`, vốn không cho biết bản ghi nào bị bỏ qua) để biết chính xác cái nào mới. Kiểu FE tách riêng `UnlockedBadge` (không có `earnedAt`) khỏi `EarnedBadge` (có `earnedAt`, dùng cho `GET /quest/badges/me`) vì 2 nguồn dữ liệu khác nhau. Verify bằng claude-in-chrome thật: user throwaway đã có sẵn 4 badge từ trước (qua curl), chơi 1 ván HARD hoàn hảo (5 đúng/0 sai) để mở khoá `hard_master` — dialog kết quả hiện đúng banner "New badge unlocked! Bậc thầy Hard" với tên/mô tả chính xác; verify qua curl thêm: gọi `POST /quest/attempts` 2 lần cùng dữ liệu, lần 2 `newBadges: []` (không trao lại badge đã có).

- [ ] **FE: confetti ăn mừng khi kết thúc ván tốt**
  📍 thêm `canvas-confetti` vào `client/package.json`, bắn confetti trong `quest-result-dialog.tsx` khi ván hoàn hảo (`wrongCount === 0`) hoặc có `newBadges` mới (phụ thuộc mục badge ở trên).

---

## Ghi chú thứ tự ưu tiên

DB đi trước BE, BE đi trước FE trong từng nhóm P vì FE cần contract API thật để gọi (tránh mock rồi phải sửa lại). Trong P0, tách endpoint `answer` riêng khỏi `attempts` ngay từ đầu — nếu để P1 mới tách sẽ phải đổi lại toàn bộ luồng chấm điểm ở FE đã build từ P0, tốn công hơn làm đúng từ đầu.
