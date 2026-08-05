# 🗺️ AlgoMinds — Roadmap: Career Journey & AI-Native Features

> Bản roadmap Career Journey P0/P1 gốc (gộp 5 tab LeetCode-style thành pipeline, data model nền: `CareerTrack`/`CareerTrackStage`/`CareerJourney`/`JourneyStageProgress`/`InterviewerPersona`/`HiringEvent`/`UserPersonaUnlock`/`StageDigest`) đã hoàn thành 100% (2026-08-05) — xem lịch sử git (`78e8a5d`..`82bdff4`) nếu cần tham chiếu lại nội dung cũ.
> Bản này thay thế phần plan đó. Sau khi dùng thử, nhận xét (2026-08-06): pipeline UI đầy đủ nhưng "nông" — advance giữa các stage là 2 nút bấm tay (không có auto-grading nào), `InterviewerPersona` không hề ảnh hưởng tới cách AI phỏng vấn thật (chỉ là nhãn hiển thị), stage `QUEST` không liên kết dữ liệu thật (chỉ redirect sang `/quest` chung), leaderboard/Offer Debrief là các chỉ số/nội dung không cá nhân hoá theo người dùng.
>
> Data model nền (`CareerTrack` → `CareerTrackStage` → `CareerJourney` → `JourneyStageProgress`, cộng `InterviewerPersona`/`HiringEvent`/`UserPersonaUnlock`/`StageDigest`) **giữ nguyên, không đổi** — vẫn là hạ tầng đúng. Cái cần làm lại là lớp hành vi phía trên: biến pipeline từ "cái vỏ điều hướng bọc quanh `sessions`/`ai` có sẵn" thành 1 hệ thống **thực sự đánh giá và thích ứng theo người dùng** — tận dụng đúng 2 tính năng net-new đã xong ở P2/P3 bên dưới (Confidence Calibration, Weakness data, Live Co-Interview) làm nguyên liệu, thay vì để chúng nằm không.

## Nhiệm vụ mới của Career Journey

Không còn là "gộp tab" (việc đó đã xong, giữ nguyên). Từ P4 trở đi, Career Journey phải trả lời đúng 4 nhu cầu thật của người đi phỏng vấn mà bản gốc chưa chạm tới:

| Nhu cầu thật | Cơ chế cũ (nông) | Cơ chế mới |
|---|---|---|
| Biết mình qua/rớt dựa trên gì | Tự bấm "Mark as Passed/Failed" | Auto-grade từ `Evaluation`/`QuestAttempt`/`PeerInterviewEvaluation` thật, có ngưỡng (P4) |
| Cảm giác phỏng vấn viên có "tính cách" thật | `personaId` chỉ hiển thị tên | `personaId` đổi thật system instruction Gemini đang dùng (P4) |
| Được luyện đúng chỗ yếu, không phải bài cố định | Stage trỏ 1 `problemId` tĩnh | Stage "adaptive" chọn bài theo tag yếu nhất tính từ dữ liệu Submission/Confidence thật (P5) |
| Vòng cuối giống phỏng vấn thật, không phải máy chấm 1 mình | `QUEST`/`PROBLEM` solo với AI | Vòng Behavioral dùng Live Co-Interview (người thật) làm 1 loại stage (P6) |

Kết thúc journey, thay vì chỉ có Offer Debrief (nội dung chung của người khác), có thêm 1 **Readiness Report** cá nhân hoá tổng hợp toàn bộ hành trình (P7).

## Cách đọc file này
- `🟢 P2` / `🔵 P3` — đã hoàn thành, giữ nguyên không sửa. Ghi ở đây vì P5/P7 bên dưới phụ thuộc trực tiếp dữ liệu/hạ tầng 2 phase này (Confidence Calibration, Weakness data, Live Co-Interview).
- `🔴 P4` — sửa 2 lỗ hổng nông nhất của Career Journey gốc: auto-grading thật + persona ảnh hưởng AI thật. Không cần model/DB lớn, ưu tiên làm trước.
- `🟡 P5` — Quest liên kết thật vào journey + chọn bài tiếp theo thích ứng theo điểm yếu. Phụ thuộc cơ chế retry vừa thêm ở P4.
- `🟣 P6` — Track gắn Company thật + vòng Behavioral dùng Live Co-Interview thật thay vì AI/Quest solo. Phụ thuộc `autoGradeStage` dùng chung từ P4, tái dùng nguyên hạ tầng P3.
- `🟤 P7` — Readiness Report cuối journey, do Gemini tổng hợp. Phụ thuộc dữ liệu attempt/weak-tag/confidence sinh ra từ P4-P6 nên luôn đứng cuối.
- Mỗi task ghi **vị trí code** liên quan, và các chỗ đánh dấu **"cần quyết định sản phẩm"** đã hỏi lại user trước khi ghi vào đây (xem quyết định trong từng mục) — không tự ý giả định thêm khi implement.

---

## 🟢 P2 — Tính năng net-new (không có ở LeetCode)

- [x] **BE: `GET /sessions/:id/replay` — Interview Replay & Weakness Reel**
  📍 `server/src/modules/sessions/`. Compose lại theo thời gian: `SessionEvent` (transition) + `Message` (nội dung chat Phase 1) + `Evaluation` (điểm/feedback) thành 1 timeline duy nhất, đánh dấu rõ đoạn nào AI phát hiện lỗ hổng chiến lược. Không cần Gemini call mới — thuần đọc dữ liệu đã có sẵn 3 bảng này.
  FE: `client/src/features/interview/` (hoặc `career`) thêm trang replay, tái dùng cách render message hiện có trong `interview-room.tsx` (đọc component chat panel hiện tại trước khi viết mới — không tạo renderer riêng).
  **2 gap phát hiện khi implement — đã hỏi lại user trước khi quyết định phạm vi**:
  1. `SessionEvent` **không được ghi ở bất kỳ đâu trong codebase** (không phải chỉ thiếu ở đây — grep toàn bộ `server/src` không thấy `sessionEvent.create()` nào). Vá gap đó cần thêm write ở nhiều điểm trong `sessions.service.ts` + `ai.processor.ts`, rủi ro cao hơn hẳn 1 endpoint đọc thuần. Đã hỏi user, chọn: **không dùng `SessionEvent`** trong Replay — timeline chỉ compose từ `Message` + `Evaluation` (2 bảng có dữ liệu thật), không thêm write nào vào `sessions`/`ai`. Gap `SessionEvent` để lại làm việc riêng sau này.
  2. `Message.phaseContext` cũng là dead field (không ai từng ghi) nên không dùng để tách "message thuộc Phase 1 hay Phase 2". Thay vào đó suy luận lại mốc chuyển phase từ chính message AI **approve đầu tiên** trong danh sách (đúng y hệt điều kiện `isApproved && status === PHASE_1_STRATEGY` đang dùng thật trong `ai.processor.ts`) — message AI trước hoặc tại mốc đó mà chưa approve = "AI phát hiện lỗ hổng chiến lược" (`flagged: true`); message sau mốc đó không bao giờ bị đánh dấu dù AI trả lời "Rejected" cho câu hỏi lạc đề ở Phase 2.
  **Đã làm**: `SessionsService#getReplay(id, userId)` — check quyền sở hữu giống `findOne()`, trả `{ session: {id, status, startedAt, finishedAt, problem}, timeline: (Message | Evaluation)[] }` đã sort theo `createdAt`. `GET /sessions/:id/replay` (route `:id/replay` không đụng route `:id` sẵn có vì khác số segment).
  FE: tách `MessageBubble` ra khỏi `ai-chat-tab.tsx` thành component riêng (`console-panel/message-bubble.tsx`) để trang replay tái dùng đúng 1 renderer, cập nhật lại `ai-chat-tab.tsx` dùng chung — đúng yêu cầu "không tạo renderer riêng". Trang mới `session-replay-page.tsx` (route `/interview/replay/:sessionId`, cùng nhóm `ProtectedRoute` với `InterviewRoom`) tái dùng luôn `AIEvaluationSection` có sẵn trong `problem-panel/` cho entry `EVALUATION` (không viết lại scorecard). Entry điểm vào: nút icon `History` mới trong `interview-header.tsx` (chỉ hiện khi có `sessionId`), điều hướng qua `navigate()`.
  **Verify thật trong Chrome, gồm cả real Gemini call** (không chỉ code review): đăng nhập user test, mở `/interview/two-sum`, cố ý gửi 1 chiến lược sai ("đoán ngẫu nhiên không kiểm tra tổng") → AI reject thật; gửi tiếp chiến lược đúng (hash map O(n)) → AI approve thật, chuyển Phase 2. Gọi trực tiếp `GET /sessions/:id/replay` qua curl xác nhận đúng thứ tự + `flagged` đúng (message reject đầu = `true`, 3 message còn lại = `false`). Sau đó vào `/interview/replay/:sessionId` qua UI thật (cả bằng cách gõ URL lẫn bấm nút History trên header) — hiển thị đúng: bubble user/AI đúng màu, label cảnh báo "AI found an issue..." chỉ xuất hiện trên đúng 1 message bị reject, viền amber quanh bubble đó. Không có console error. Đã xoá sạch user/session test sau khi verify. `npm run lint` + `npm run build` (client + server) đều pass.

- [x] **DB+BE: Confidence Calibration Score**
  📍 `server/src/modules/ai/ai.service.ts` — mở rộng JSON contract của Model 1 (Phase 1 Strategy Evaluation, dòng 41-45 hiện tại `{ "status", "message" }`) thêm field `"confidenceSignal": "hedging" | "neutral" | "assertive"` (Gemini tự đánh giá dựa trên cách ứng viên diễn đạt — không đổi 2 field `status`/`message` hiện có để không phá contract cũ).
  `Session` thêm field `confidenceSignal String?` để lưu lại. Aggregate xu hướng theo thời gian: so sánh `confidenceSignal` các session với `SubmissionStatus`/`Evaluation.scores` tương ứng — dùng để phát hiện lệch pha "tự tin thái quá nhưng sai" hay "đúng nhưng thiếu tự tin". Hiển thị ở `client/src/features/users/pages/profile-page.tsx`, card mới cạnh `badges-card.tsx`.
  **Đã làm**: thêm `Session.confidenceSignal String?` (migration `20260805034813_add_session_confidence_signal`), thêm field thứ 3 vào JSON contract của `STRATEGY_SYSTEM_INSTRUCTION` đúng như mô tả (không đổi `status`/`message`), cộng quy tắc số 6 giải thích cách phân loại giọng điệu (hedging/assertive/neutral) tách biệt hoàn toàn khỏi đúng/sai. `ai.processor.ts` parse `confidenceSignal` từ response, validate chỉ nhận đúng 3 giá trị hợp lệ (giá trị lạ → `null`, không lưu rác), ghi vào cùng update call đã dùng cho `strategyAnswer`/`strategyFeedback` ở P2 mục trước (persist tại thời điểm approve — nhất quán với cách 2 field kia đã làm, không cần hỏi lại user vì đây đúng pattern đã duyệt).
  Aggregate: thêm `UsersService#getConfidenceCalibration(userId)` + `GET /users/me/confidence-calibration` — với mỗi session đã có `confidenceSignal` (session cũ trước bản cập nhật này có giá trị `null`, tự động bị loại khỏi thống kê thay vì tính sai), nhóm theo 3 giọng điệu, tính "đã giải đúng" = có `Submission.status = ACCEPTED`; suy ra `overconfidentCount` (assertive nhưng không có submission ACCEPTED nào) và `underconfidentCount` (hedging nhưng có).
  FE: card mới `confidence-calibration-card.tsx` — 3 ô đếm theo giọng điệu (kèm tỉ lệ giải đúng/tổng mỗi ô) + 2 dòng insight (overconfident màu amber, underconfident màu xanh) chỉ hiện khi count > 0. Gắn vào `profile-page.tsx` thành 1 hàng full-width riêng ngay dưới hàng `SolvedStatsCard`+`BadgesCard` (không nhét vào ô 220px cạnh `BadgesCard` vì cần đủ rộng cho 3 cột) — "cạnh" hiểu theo nghĩa cùng khu vực/ngay sau, không phải cùng 1 hàng chật.
  **Verify thật trong Chrome, gồm cả real Gemini + real Piston submit** (không chỉ code review): đăng nhập user test, gửi 1 chiến lược **cố ý diễn đạt rất chắc chắn** ("This is definitely the optimal solution... This will absolutely work") cho `two-sum` → AI approve thật, xác nhận qua `GET /users/me/confidence-calibration` thấy `confidenceSignal: "assertive"` được ghi. Sau đó cố ý submit code sai (`return [0, 0]` cứng) → submission thật qua Piston fail (không ACCEPTED). Gọi lại API xác nhận đúng: `bySignal.assertive = {total: 1, correct: 0}`, `overconfidentCount: 1`. Vào `/profile` qua UI thật — card hiện đúng "1" ở ô Assertive, "0/1 solved", dòng insight amber "1 time(s) you sounded assertive but didn't solve it". Không console error. Đã xoá sạch user/session test sau khi verify. `npm run lint` + `npm run build` (client + server) đều pass.
  **P2 hoàn thành** — cả 2 tính năng net-new đã có BE+FE thật, verify bằng dữ liệu thật qua Gemini/Piston chứ không phải mock, không phải chỉ scaffold.

---

## 🔵 P3 — Live Co-Interview Mode (Đã hoàn thành 2026-08-05)

> Phức tạp và rủi ro nhất trong roadmap này — đụng trực tiếp `chat.gateway.ts` (đã có `forwardRef()` cycle với `AiModule`, xem `.claude/rules/workflow.md` mục "forwardRef() — không tự ý fix") và hiện **chưa có `.spec.ts` nào che phủ** module `chat`. Cần 1 buổi thiết kế kỹ riêng (role model, quyền truy cập room, cách AI "quan sát" mà không chặn luồng `send_message` hiện có) trước khi code, không nhảy thẳng vào implement từ mục này.

- [x] **Thiết kế (chưa code): role thứ 2 trong 1 session room**
  📍 `server/src/modules/chat/chat/chat.gateway.ts` — hiện `join_room` (dòng 108) chỉ cho phép đúng `session.userId` join. Cần mở rộng: 1 session có thể có `role: "CANDIDATE" | "PEER_INTERVIEWER"`, AI chuyển từ vai "giám khảo duyệt/từ chối chiến lược" sang "quan sát viên" — không chặn Phase 1 → Phase 2 nữa mà để `PEER_INTERVIEWER` (người thật) quyết định, AI chỉ chấm ngầm sau khi xong.
  **Cần quyết định sản phẩm**: session kiểu này có tính là `Session` bình thường (đi qua state machine `PHASE_1_STRATEGY` → `PHASE_2_IMPLEMENT` hiện có) hay cần 1 loại session riêng? Ảnh hưởng trực tiếp tới `sessions.service.ts` — đọc kỹ `.claude/rules/workflow.md` mục "Luồng phiên phỏng vấn" trước khi quyết.

  **Quyết định (hỏi lại user qua `AskUserQuestion` trước khi thiết kế chi tiết)**: model **riêng** — `PeerInterviewSession`, không đụng `Session`/`sessions.service.ts`/state machine `PHASE_1_STRATEGY`↔`PHASE_2_IMPLEMENT` hiện có. Lý do: `Session.userId` là 1 FK duy nhất, không có chỗ cho người thứ 2 mà không sửa bảng trung tâm nhất hệ thống (Career Journey, Judge, Replay, Confidence Calibration đều phụ thuộc `Session`) — trong khi module `chat` hiện chưa có `.spec.ts` nào, rủi ro càng cao nếu đụng chung state machine.

  **Đọc lại code thật trước khi thiết kế** (không đoán): `chat.gateway.ts#handleJoinRoom`/`handleMessage` hiện chỉ có 1 nhánh kiểm tra `session.userId === socketUser.userId`; `handleMessage` LUÔN LUÔN gọi `aiQueue.add('chat-job', ...)` sau mỗi tin nhắn — đây chính là hành vi "AI gatekeeper" cần tắt hẳn cho peer-interview. Roadmap gốc ghi "AI chỉ chấm ngầm SAU KHI XONG" — nghĩa là AI không cần quan sát real-time trong lúc chat, chỉ chạy 1 lần ở cuối. Điều này đơn giản hoá thiết kế đáng kể: **không cần AI tham gia gì trong lúc phòng đang hoạt động**, event `send_peer_message` không gọi `ai-queue` — chỉ lưu + broadcast. `AiProcessor` (`ai.processor.ts`) đã sẵn `@Inject(forwardRef(() => ChatGateway))` để emit socket event sau khi xử lý job — tái dùng đúng class này cho job chấm điểm cuối buổi thay vì tạo thêm 1 forwardRef cycle mới.

  **Data model (sketch, chưa migrate)**:
  ```prisma
  enum PeerSessionStatus {
    WAITING_FOR_PEER // vừa tạo, đợi người thứ 2 join bằng inviteCode
    ACTIVE
    COMPLETED
    ABANDONED
  }

  enum PeerRole {
    CANDIDATE
    PEER_INTERVIEWER
  }

  model PeerInterviewSession {
    id                String            @id @default(uuid())
    candidateId       String
    peerInterviewerId String?           // null cho tới khi có người join
    problemId         String
    status            PeerSessionStatus @default(WAITING_FOR_PEER)
    inviteCode        String            @unique // share cho người thứ 2 join qua POST /peer-interviews/join/:inviteCode
    startedAt         DateTime          @default(now())
    endedAt           DateTime?

    candidate       User    @relation("PeerInterviewCandidate", fields: [candidateId], references: [id], onDelete: Cascade)
    peerInterviewer User?   @relation("PeerInterviewInterviewer", fields: [peerInterviewerId], references: [id])
    problem         Problem @relation(fields: [problemId], references: [id])
    messages        PeerInterviewMessage[]
    evaluation      PeerInterviewEvaluation?

    @@map("peer_interview_sessions")
  }

  model PeerInterviewMessage {
    id        String   @id @default(uuid())
    sessionId String
    role      PeerRole // CANDIDATE hay PEER_INTERVIEWER gửi — không tái dùng MessageSender (enum đó gắn với Session/AI)
    senderId  String
    content   String
    createdAt DateTime @default(now())

    session PeerInterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

    @@index([sessionId, createdAt])
    @@map("peer_interview_messages")
  }

  model PeerInterviewEvaluation {
    id                       String   @id @default(uuid())
    sessionId                String   @unique
    candidateScore           Int
    candidateFeedback        String
    peerInterviewerScore     Int
    peerInterviewerFeedback  String
    createdAt                DateTime @default(now())

    session PeerInterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

    @@map("peer_interview_evaluations")
  }
  ```
  Cần thêm back-relation `User.candidateInPeerSessions`/`User.peerInterviewerInPeerSessions` và `Problem.peerInterviewSessions` khi thực sự migrate.

  **Gateway — chỉ thêm handler mới, KHÔNG sửa `join_room`/`send_message` đang có**:
  - `join_peer_room` — auth: `socketUser.userId === candidateId || socketUser.userId === peerInterviewerId`.
  - `send_peer_message` — lưu `PeerInterviewMessage`, broadcast `receive_peer_message`. Không gọi `ai-queue`.
  - `end_peer_interview` — chỉ candidate hoặc peer interviewer gọi được; set `status = COMPLETED`, `endedAt`, enqueue job `grade-peer-interview` vào **`ai-queue` đã có sẵn** (không tạo queue mới).

  **REST (module mới `peer-interview`, không đụng `sessions`/`chat` module hiện có)**:
  - `POST /peer-interviews` — candidate tạo, body `{ problemId }`, sinh `inviteCode`.
  - `POST /peer-interviews/join/:inviteCode` — người thứ 2 join (guard: không cho tự join session của chính mình).
  - `GET /peer-interviews/:id` — auth: phải là candidate hoặc peerInterviewer.

  **AI — Model 4 trong `ai.service.ts`, theo đúng pattern Model 3 (Offer Debrief) vừa làm ở P1**:
  ```
  Input: toàn bộ PeerInterviewMessage[] (role + content) + problemContext.
  Output JSON:
  {
    "candidate": { "score": 0-100, "feedback": "string" },
    "peerInterviewer": { "score": 0-100, "feedback": "string" }
  }
  ```
  Xử lý trong CHÍNH `AiProcessor` hiện có (thêm job type `grade-peer-interview` bên cạnh `chat-job`/`evaluate-code`) — không tạo processor/forwardRef mới, dùng lại `chatGateway` đã inject sẵn để emit `peer_interview_graded`.

  **Phạm vi cố tình giới hạn** (để giữ rủi ro thấp nhất có thể cho tính năng chạm vào module chưa có test):
  - KHÔNG tích hợp code editor/Judge/Piston — peer-interview thuần hội thoại (đúng như mô tả chấm điểm gốc chỉ dựa trên `Message[]`, không nhắc submission).
  - KHÔNG đụng `Session`, `sessions.service.ts`, `ai.processor.ts#processChat`, hay 2 handler `join_room`/`send_message` đang có — hoàn toàn cộng thêm (additive), không sửa.
  - KHÔNG trừ `UserStats.credits` mỗi tin nhắn như luồng 1:1 hiện tại — vì AI không phản hồi real-time, chỉ chạy đúng 1 lần lúc kết thúc.
  **User xác nhận implement (2026-08-05)**: yêu cầu "lên lại kế hoạch rõ ràng cho P3 vào roadmap và thực hiện nó" — coi như xác nhận bắt đầu code toàn bộ P3 theo đúng thiết kế đã chốt ở trên, không đổi phạm vi.

- [x] **BE: schema migration**
  📍 `server/prisma/schema.prisma` — thêm đúng 2 enum (`PeerSessionStatus`, `PeerRole`) + 3 model (`PeerInterviewSession`, `PeerInterviewMessage`, `PeerInterviewEvaluation`) như sketch, cộng back-relation `User.candidateInPeerSessions`/`peerInterviewerInPeerSessions` và `Problem.peerInterviewSessions`. Migration `20260805045159_add_peer_interview_models`, không đụng model nào khác.

- [x] **BE: module `peer-interview` (REST)**
  📍 `server/src/modules/peer-interview/` — module mới độc lập (`peer-interview.module.ts`/`.controller.ts`/`.service.ts`/`dto/create-peer-interview.dto.ts`), đúng 3 endpoint đã thiết kế: `POST /peer-interviews` (sinh `inviteCode` 8 hex chars qua `crypto.randomBytes`, retry khi trùng `@unique`), `POST /peer-interviews/join/:inviteCode` (chặn tự join phiên của chính mình, chặn join phiên đã có đủ 2 người/đã kết thúc), `GET /peer-interviews/:id` (chỉ candidate hoặc peerInterviewer truy cập được). Đăng ký vào `app.module.ts`.

- [x] **BE: `chat.gateway.ts` — handler mới, additive**
  📍 Thêm đúng 3 handler như thiết kế: `join_peer_room` (room riêng `peer:<id>`, không đụng room của `join_room`), `send_peer_message` (lưu `PeerInterviewMessage`, broadcast `receive_peer_message`, KHÔNG gọi `aiQueue`), `end_peer_interview` (chỉ candidate/peerInterviewer gọi được, set `COMPLETED`, broadcast `peer_interview_ended`, enqueue job `grade-peer-interview` vào đúng `ai-queue` có sẵn). Không sửa 1 dòng nào của `handleJoinRoom`/`handleMessage` hiện có.

- [x] **BE: AI Model 4 + job `grade-peer-interview`**
  📍 `ai.service.ts` — thêm `peerInterviewModel` (Model 4, JSON contract `{candidate:{score,feedback}, peerInterviewer:{score,feedback}}`) + `gradePeerInterview()`. `ai.processor.ts` — thêm nhánh job `grade-peer-interview` trong `AiProcessor` có sẵn (không tạo processor/forwardRef mới), `processGradePeerInterview()` load `PeerInterviewMessage[]` + `Problem`, gọi Gemini, upsert `PeerInterviewEvaluation`, emit `peer_interview_graded` qua `chatGateway` đã inject sẵn.

- [x] **FE: feature `peer-interview`**
  📍 `client/src/features/peer-interview/` — đúng cấu trúc feature-folder chuẩn (`types/api/hooks/pages`), 2 trang: lobby (`peer-interview-lobby-page.tsx` — tạo phiên chọn bài qua `useProblems()`, hoặc join bằng invite code) và room (`peer-interview-room-page.tsx` — chờ đối phương join với poll nhẹ `refetchInterval` khi còn `WAITING_FOR_PEER`, chat 2 chiều qua `use-peer-interview-socket.ts`, nút "End interview", card kết quả chấm điểm AI). Route `/peer-interview` (trong `DashboardLayout`) và `/peer-interview/:id` (trong `ProtectedRoute`, full-screen giống `/interview/:slug`) ở `router-instance.tsx`, thêm mục sidebar. i18n namespace mới `peerInterview` (3 locale, đăng ký trong `i18n/index.ts`) — không gộp vào `interview.json` vì đây là feature riêng.

  **Bug thật phát hiện khi verify (không liên quan P3, đã sửa)**: `client/src/features/auth/types/index.ts` khai báo `User.id`, nhưng backend (`auth.service.ts#generateToken`) luôn trả `user: { userId, email, role }` — không có field `id`. Bug này nằm im từ trước vì chưa có chỗ nào trong code thật sự đọc `user.id`; peer-interview-room-page.tsx (cần so `currentUserId` để canh trái/phải tin nhắn và xác định vai trò) là chỗ ĐẦU TIÊN dùng tới field này nên lộ ra ngay khi test. Sửa: đổi `User.id` → `User.userId` (khớp runtime), `name`/`avatarUrl` chuyển thành optional (chỉ có ở `GET /users/me`, không có ở payload login/register/refresh).

  **Verify thật trong Chrome bằng 2 tab/2 tài khoản test** (không mock, real Gemini): tạo 2 account test qua `/auth/register`, tab 1 (candidate) tạo phiên với bài Two Sum → nhận invite code → tab 2 (peer interviewer) join bằng code → cả 2 chiều `send_peer_message`/`receive_peer_message` hiển thị đúng vai trò, đúng canh trái/phải, real-time không cần refresh. Candidate bấm "End interview" → cả 2 tab nhận `peer_interview_ended` → "AI is grading this session..." → vài giây sau cả 2 tab nhận `peer_interview_graded` cùng lúc với kết quả **giống hệt nhau**: Candidate 70/100, Peer Interviewer 60/100, kèm feedback text hợp lý bám sát đúng nội dung hội thoại đã gửi (không phải placeholder). Không console error ở cả 2 tab. Đã xoá sạch 2 user test (cascade xoá luôn `PeerInterviewSession`/`Message`/`Evaluation` liên quan) sau khi verify.
  Lưu ý riêng cho việc test đa-tài khoản: reload trang (`navigate` full page) trong lúc 1 tab khác vừa đăng nhập sẽ khiến `AuthHydrator` gọi `/auth/refresh` bằng cookie `refreshToken` **dùng chung theo browser profile**, có thể "giật" nhầm danh tính tab đang test (không phải bug sản phẩm — user thật mỗi người 1 trình duyệt/cookie jar riêng) — tránh reload sau khi cả 2 bên đã đăng nhập, chỉ điều hướng trong-app (client-side routing).
  `npm run lint` + `npm run build` (client + server) đều pass.

**P3 hoàn thành** — Live Co-Interview Mode có đủ BE (schema, REST, gateway, AI Model 4) + FE thật, verify bằng 2 tài khoản thật qua Chrome với Gemini thật, không phải chỉ scaffold.

---

## 🔴 P4 — Auto-grading thật + Persona ảnh hưởng AI thật (Đã hoàn thành 2026-08-06)

- [x] **DB: `CareerTrackStage.passThreshold` + `JourneyStageProgress.attemptCount`**
  📍 `server/prisma/schema.prisma`.
  ```prisma
  model CareerTrackStage {
    // ...giữ nguyên các field hiện có...
    passThreshold Int @default(70) // 0-100, ngưỡng điểm tối thiểu để PASS stage này
  }

  model JourneyStageProgress {
    // ...giữ nguyên các field hiện có...
    attemptCount Int @default(0) // tăng mỗi lần được evaluate mà chưa đạt threshold
  }
  ```
  `passThreshold` áp dụng cho cả 2 kind hiện có: `PROBLEM` so với điểm trung bình 4 field `Evaluation.scores`; `QUEST` so với tỉ lệ đúng — nhánh QUEST tự động hoá thật ở P5 (P4 chỉ tự động hoá PROBLEM trước, giữ phạm vi migration nhỏ).
  **Đã làm**: thêm đúng 2 field như trên, migration `20260805215836_add_stage_pass_threshold_and_attempt_count`. `npx prisma format` + `validate` trước migrate, `npx prisma generate` sau đó.

- [x] **BE: auto-grade nhánh PROBLEM qua event, bỏ auto-FAIL — cho retry**
  📍 `server/src/modules/ai/ai.processor.ts#processEvaluateCode` — sau khi `evaluation.upsert` thành công, emit event `evaluation.completed` (`EventEmitter2`, cần inject vào `AiProcessor`) với payload `{ sessionId, scores: evaluation.scores }`. Không đổi gì khác trong hàm này.
  📍 `server/src/modules/career/career.listener.ts` — thêm `@OnEvent('evaluation.completed')`: tra `Session.journeyProgress` (relation 1-1 có sẵn) qua `sessionId`; nếu null (session không thuộc career journey) → bỏ qua, không phá hành vi Phase 2 thường của `sessions`/`chat`. Nếu có và `status === ACTIVE`, tính điểm trung bình 4 field `scores`, gọi `CareerService.autoGradeProblemStage(journeyProgressId, avgScore)`.
  📍 `career.service.ts` — thêm `autoGradeProblemStage(progressId, avgScore)`: so `avgScore` với `stage.passThreshold`.
    - Đạt: gọi lại logic đóng-stage-mở-stage-kế hiện có trong `advanceJourney` — tách phần thân sau khi đã biết `status: 'PASSED'` thành `private applyStageOutcome(journey, activeProgress, status)` dùng chung cho cả `advanceJourney` (đường thủ công còn lại: "give up") và `autoGradeProblemStage`.
    - Không đạt (**quyết định đã chốt: cho retry, không tự FAILED**): **không** đổi `JourneyStageProgress.status`, chỉ `update` tăng `attemptCount`, emit socket `career_stage_retry_needed` (`{ journeyId, stageId, avgScore, passThreshold }`) qua `chatGateway`/1 gateway riêng của career (kiểm tra lúc code: tái dùng `ChatGateway.server` sẵn có, room theo `sessionId`, giống cách `ai.processor.ts` đang emit `session_status_update`, không tạo gateway mới).
  Endpoint mới `POST /career/journeys/:id/give-up`: set `JourneyStageProgress` hiện `ACTIVE` → `FAILED`, đóng `CareerJourney` → `FAILED`, `finishedAt`. Đây là nhánh **duy nhất** còn set `FAILED` thủ công. `advanceJourney` cũ (`POST /career/journeys/:id/advance`) giữ lại nhưng chỉ dùng cho stage `QUEST` tới khi P5 tự động hoá nốt — bỏ khả năng nhận `status: 'PASSED'` thủ công cho stage `PROBLEM` (validate ở DTO: nếu `activeProgress.stage.kind === PROBLEM`, từ chối request thủ công, trả lỗi rõ "stage này auto-grade, không tự đánh dấu passed").
  **Đã làm**: đúng như thiết kế trên. Tên method thật là `autoGradeStage` (không phải `autoGradeProblemStage`) — đặt tên chung ngay từ đầu vì P5/P6 sẽ gọi lại y hệt hàm này cho `QUEST`/`PEER_INTERVIEW`, tránh phải rename sau. `applyStageOutcome` nhận `journey`/`activeProgress` dạng object literal type (không tạo `Prisma.CareerJourneyGetPayload<...>` riêng) — khớp style hiện có của `ensureStageSession` trong cùng file. `CareerModule` thêm import `ChatModule` (đã export sẵn `ChatGateway`) — không tạo `forwardRef()` mới vì chiều phụ thuộc chỉ 1 chiều (`career` → `chat`, `chat` không import ngược lại). `advanceJourney` chặn **cả 2** giá trị `status` (không chỉ `PASSED`) cho stage `PROBLEM` — nhất quán hơn để lại đúng 1 cửa thủ công duy nhất (`give-up`) thay vì cho phép `advance` với `FAILED` chạy song song với `give-up`.
  `npm run build` + `npm run lint` (server) pass.

- [x] **BE: persona ảnh hưởng AI thật**
  📍 `ai.processor.ts#processChat` — sửa query `prisma.session.findUnique` đầu hàm, thêm include `journeyProgress: { include: { stage: true } }`. Trước khi gọi `this.aiService.generateResponse(...)`, lấy `const personaId = session.journeyProgress?.stage?.personaId`, truyền vào làm tham số thứ 4 — tham số này **đã tồn tại sẵn** trong `AiService.generateResponse`/`resolveStrategyModel` (`ai.service.ts` dòng 226-268, 196-224), chỉ chưa từng được truyền từ đây. Session ngoài career journey: `personaId` là `undefined` → hành vi giữ nguyên y hệt hiện tại (dùng `this.model` mặc định, không tốn thêm Prisma round-trip).
  **Đã làm**: đúng như thiết kế trên, không đổi gì khác trong `processChat`.

- [x] **FE: bỏ nút bấm tay cho stage PROBLEM, thêm banner retry**
  📍 `client/src/features/career/pages/career-journey-page.tsx` — bỏ nút "Mark as Passed" khỏi stage `kind=PROBLEM` (giữ cho `QUEST` tới P5). Đổi nút "Mark as Failed" thành "Give up on this track" (gọi endpoint `give-up` mới), chỉ hiện khi `attemptCount > 0`.
  Hook mới `use-career-socket.ts` (pattern giống `use-interview-socket.ts` trong feature `interview`) lắng nghe `career_stage_retry_needed`, hiện banner ngay trên stage `ACTIVE`: "Chưa đạt {avgScore}/100, cần tối thiểu {passThreshold} — sửa code và nộp lại."
  **Đã làm**: thêm `use-give-up.ts` (mutation, pattern giống `use-advance-journey.ts`) + `use-career-socket.ts` (join `sessionId` của stage đang `ACTIVE`, đúng room mà `chat.gateway.ts#join_room` đã dùng — cần join lại từ trang Career Journey vì user có thể xem trang này mà không mở `/interview/:slug`). Thêm 2 field `passThreshold`/`attemptCount` vào type `CareerTrackStage`/`JourneyStageProgress` (`types/index.ts`) khớp response thật. Thêm key i18n `retryBanner`/`giveUp` ở cả 3 locale. Stage `QUEST` giữ nguyên 2 nút bấm tay cũ (chưa tự động hoá, để P5).
  `npm run lint` + `npm run build` (client) pass.

**Verify thật qua Node script (socket.io-client + fetch), gồm cả real Gemini + real Piston, không mock**: tạo tạm 1 `CareerTrack`/`CareerTrackStage` (`passThreshold: 95`, problem `two-sum`, persona `default`) qua script Prisma trực tiếp. Đăng ký user test, `start` track qua API thật → nhận `sessionId`. Kết nối socket thật, `join_room`, gửi chiến lược đúng (hash map O(n)) qua `send_message` → AI approve thật, session sang `PHASE_2_IMPLEMENT`. Nộp code Python **đúng nhưng cố tình xấu** (`O(n²)`, tên biến `a,b,x,y`) qua `POST /judge/submit` (Piston thật — container dev chỉ có runtime `python`/`java`/`c++`, không có `node`, nên test dùng `python`) → nhận đúng socket `career_stage_retry_needed` với `avgScore: 45, passThreshold: 95, attemptCount: 1`; `GET /career/journeys/me/active` xác nhận journey vẫn `IN_PROGRESS`, stage vẫn `ACTIVE` — **không** tự `FAILED`, đúng quyết định retry đã chốt. Nộp lại code Python sạch/hiệu quả (hash map, docstring, đặt tên rõ) → `evaluate-code` chấm điểm cao hơn threshold, `autoGradeStage` tự `applyStageOutcome('PASSED')` — hết stage duy nhất trong track nên journey tự đóng `PASSED`, `finishedAt` được set, `attemptCount` giữ nguyên `1` (đúng lịch sử số lần thử). Riêng persona: seed 1 persona tạm với `systemPromptExtra` yêu cầu Gemini luôn bắt đầu `message` bằng chuỗi đánh dấu cố định, gắn vào 1 stage khác, gửi 1 chiến lược qua chat thật — phản hồi AI thật trả về đúng bắt đầu bằng chuỗi đánh dấu đó, xác nhận `personaId` từ `JourneyStageProgress.stage` đã thay đổi thật system instruction Gemini đang dùng (không còn cosmetic). Đã xoá sạch track/persona/journey/session/user test sau khi verify — không phải seed thật.

---

## 🟡 P5 — Quest liên kết thật + Adaptive next-stage theo điểm yếu

- [ ] **BE: nối `QuestAttempt` vào `JourneyStageProgress` thật + auto-grade nhánh QUEST**
  📍 `server/src/modules/quest/quest.service.ts#createAttempt` — sau khi `prisma.questAttempt.create(...)`, tìm `JourneyStageProgress` đang `ACTIVE`, `questAttemptId: null`, `stage.kind: QUEST`, `journey.userId: userId` (`findFirst`). Nếu có: `update` gắn `questAttemptId`, tính tỉ lệ đúng `(correctCount/(correctCount+wrongCount))*100`, gọi lại đúng `CareerService.autoGradeProblemStage`-style logic (đổi tên chung thành `autoGradeStage(progressId, score)` để dùng cho cả PROBLEM/QUEST/PEER_INTERVIEW sau này ở P6). Không đạt threshold: theo đúng quyết định retry ở P4 — **không** tạo `JourneyStageProgress` mới, giữ `ACTIVE`, chỉ cập nhật `questAttemptId` thành attempt mới nhất mỗi lần user chơi lại 1 ván Quest mới, tăng `attemptCount`.
  Import `CareerModule`/`CareerService` vào `QuestModule` (hoặc export `CareerService` từ `CareerModule` giống cách `SessionsModule` đã `export: [SessionsService]` cho career dùng) — kiểm tra chiều phụ thuộc lúc code: `career` đã import `SessionsModule`, nếu `quest` giờ cũng cần gọi ngược vào `career`, xác nhận không tạo cycle (khác tình huống `AiModule`↔`ChatModule` — chiều phụ thuộc ở đây 1 chiều: `quest` → `career`, không ngược lại).

- [ ] **DB: pool bài theo tag cho stage "adaptive"**
  📍 `schema.prisma`.
  ```prisma
  model CareerTrackStage {
    // ...giữ nguyên...
    adaptive Boolean @default(false) // true: bỏ qua problemId tĩnh, chọn bài trong pool theo tag yếu nhất
    problemPool CareerTrackStageProblemPool[]
  }

  model CareerTrackStageProblemPool {
    stageId   String
    problemId String

    stage   CareerTrackStage @relation(fields: [stageId], references: [id], onDelete: Cascade)
    problem Problem          @relation(fields: [problemId], references: [id], onDelete: Cascade)

    @@id([stageId, problemId])
    @@map("career_track_stage_problem_pool")
  }
  ```
  Stage không `adaptive`: hành vi cũ giữ nguyên 100% (`problemId` tĩnh, không đọc pool).

- [ ] **BE: tính "tag yếu nhất" từ dữ liệu thật, chọn bài trong pool**
  📍 `career.service.ts` — method dùng chung mới `computeWeakTags(userId: string)`:
  1. `Submission` của user có `status != ACCEPTED`, trong ~90 ngày gần nhất, join `session.problem.tags` (qua `ProblemTag`), group theo `tagId`, đếm số lần.
  2. Cộng trọng số thêm cho tag nào có `Session.confidenceSignal = 'assertive'` mà vẫn sai (dữ liệu Confidence Calibration đã có sẵn từ P2 — tín hiệu "tưởng chắc mà sai" ưu tiên luyện hơn tag chỉ đơn thuần sai).
  3. Trả về danh sách tag sắp theo độ yếu giảm dần.
  `ensureStageSession` (hàm hiện có) sửa: nếu `stage.adaptive`, gọi `pickAdaptiveProblem(userId, stage)` — lấy `problemPool`, join `Tag`, chọn problem thuộc tag yếu nhất trong `computeWeakTags` mà cũng nằm trong pool VÀ user chưa từng có `Session` nào cho problem đó (tránh lặp bài đã làm); nếu user chưa đủ dữ liệu (cold start) → chọn ngẫu nhiên trong pool theo `difficulty` tăng dần. Trả kèm `pickedReasonTag` (tên tag) để FE hiển thị lý do.

- [ ] **FE: hiện lý do chọn bài**
  📍 `career-journey-page.tsx` — card stage `adaptive` hiện dòng nhỏ: "Chọn riêng cho bạn vì bạn đang yếu ở {pickedReasonTag}".

**Verify khi implement**: seed 1 stage `adaptive` với pool 3 bài thuộc 2 tag khác nhau; tạo vài `Submission` sai thuộc đúng 1 tag cho user test qua `/judge/submit` thật; start track → xác nhận stage `adaptive` chọn đúng bài thuộc tag yếu đó, không phải ngẫu nhiên. Chơi Quest thật qua `/quest` khi có stage `QUEST` đang `ACTIVE` → xác nhận `questAttemptId` tự gắn, stage tự chuyển theo kết quả, không cần bấm "Mark as Passed".

---

## 🟣 P6 — Track gắn Company thật + Behavioral Round dùng Live Co-Interview thật

- [ ] **DB: `CareerTrack` gắn `Company` có sẵn (không tạo model mới)**
  📍 `schema.prisma`.
  ```prisma
  model CareerTrack {
    // ...giữ nguyên...
    companyId String?
    company   Company? @relation(fields: [companyId], references: [id])
  }
  ```
  Back-relation `Company.careerTracks CareerTrack[]`. `companyId` optional — track "generic" không gắn công ty vẫn hợp lệ (hành vi cũ giữ nguyên cho track không set field này).

- [ ] **DB: `StageKind.PEER_INTERVIEW` + liên kết `PeerInterviewSession`**
  📍 `schema.prisma`.
  ```prisma
  enum StageKind {
    PROBLEM
    QUEST
    PEER_INTERVIEW
  }

  model JourneyStageProgress {
    // ...giữ nguyên...
    peerInterviewSessionId String? @unique
    peerInterviewSession   PeerInterviewSession? @relation(fields: [peerInterviewSessionId], references: [id])
  }
  ```
  Back-relation `PeerInterviewSession.journeyProgress JourneyStageProgress?`.

- [ ] **BE: `ensureStageSession` xử lý nhánh `PEER_INTERVIEW` + auto-grade qua điểm chấm thật**
  📍 `career.service.ts` — khi `stage.kind = PEER_INTERVIEW`: **không** tự tạo `PeerInterviewSession` lúc vào stage (khác `PROBLEM` — cần candidate chủ động tạo phòng lúc sẵn sàng mời bạn, không phải lúc load trang). Trả `JourneyStageProgress` với `peerInterviewSessionId: null`, FE hiện nút "Tạo phòng phỏng vấn chéo" thay vì "Enter Stage".
  Endpoint mới `POST /career/journeys/:journeyId/stages/:stageId/peer-session` — gọi `PeerInterviewService.create()` có sẵn (import `PeerInterviewModule`, export `PeerInterviewService` từ đó giống cách `SessionsModule` đã export cho `career`), gắn ngay `id` kết quả vào `JourneyStageProgress.peerInterviewSessionId`, trả về kèm `inviteCode` để FE hiện cho user share.
  📍 `ai.processor.ts#processGradePeerInterview` — sau khi `upsert` `PeerInterviewEvaluation` xong, emit thêm event `peer-interview.graded` (`{ peerSessionId, candidateScore }`), song song với việc emit `peer_interview_graded` qua socket đã có (P3, không đổi).
  📍 `career.listener.ts` — `@OnEvent('peer-interview.graded')`: tra `JourneyStageProgress` theo `peerInterviewSessionId`; nếu có và `ACTIVE`, gọi `autoGradeStage(progressId, candidateScore)` — dùng lại đúng hàm chung đã có từ P4/P5 (đạt → `applyStageOutcome`; không đạt → tăng `attemptCount`, giữ `ACTIVE`, FE hiện nút "Tạo phòng mới" để thử lại, đúng quyết định retry đã chốt).

- [ ] **FE**
  📍 `career-journey-page.tsx` — card track hiện logo/tên `Company` nếu `track.company` có dữ liệu. Stage `kind=PEER_INTERVIEW`: nút "Tạo phòng phỏng vấn chéo" → gọi endpoint mới → hiện `inviteCode` + nút "Vào phòng" (điều hướng `/peer-interview/:id`, tái dùng nguyên `peer-interview-room-page.tsx` đã có ở P3, không viết lại UI phòng chat). Lắng nghe `peer_interview_graded` (event đã có sẵn từ P3) qua `use-career-socket.ts` (đã thêm ở P4) để tự refetch journey sau khi được chấm.

**Verify khi implement**: seed 1 `CareerTrack` gắn `companyId` thật (dữ liệu `companies` có sẵn), 1 stage `PEER_INTERVIEW` cuối track. Dùng 2 tài khoản test tạo phòng + hoàn thành + chấm điểm thật qua Gemini (đúng cách P3 đã verify bằng 2 tab Chrome) → xác nhận stage tự chuyển PASSED/retry theo `candidateScore`, không cần bấm nút thủ công.

---

## 🟤 P7 — Readiness Report cuối journey (Gemini tổng hợp)

- [ ] **DB: model mới**
  📍 `schema.prisma`.
  ```prisma
  model JourneyReadinessReport {
    id          String   @id @default(uuid())
    journeyId   String   @unique
    content     String   // text Gemini tổng hợp, KHÔNG markdown (đúng convention Offer Debrief — FE hiện text thuần)
    generatedAt DateTime @default(now())

    journey CareerJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)

    @@map("journey_readiness_reports")
  }
  ```
  Back-relation `CareerJourney.readinessReport JourneyReadinessReport?`.

- [ ] **BE: Model 5 trong `AiService`**
  📍 `ai.service.ts` — thêm `readinessReportModel` (text tự do, không set `responseMimeType`, cùng pattern `debriefModel`) + `generateReadinessReport(input)`. Input tổng hợp từ dữ liệu đã có sẵn sau P4-P6, không cần bảng mới nào khác:
  - Danh sách stage: label, PASSED/FAILED, điểm đạt (`avgScore`/`candidateScore`), `attemptCount` (bao nhiêu lần thử mới qua — tín hiệu độ khó thật với người này).
  - Tổng hợp `confidenceSignal` các session trong journey — tái dùng logic đã có ở `UsersService#getConfidenceCalibration` (P2), không viết lại.
  - `computeWeakTags(userId)` (đã có từ P5) — danh sách tag yếu nhất.
  Output: đoạn văn đánh giá mức độ sẵn sàng tổng thể + 2-3 điểm cụ thể cần cải thiện trước khi phỏng vấn thật, tiếng Việt, không markdown (đúng quy tắc `OFFER_DEBRIEF_SYSTEM_INSTRUCTION` đã áp dụng).

- [ ] **BE: job nền, trigger khi journey đóng thật (không trigger khi mới retry)**
  📍 `career.service.ts` — `applyStageOutcome` (khi hết stage → journey `PASSED`) và endpoint `give-up` (→ `FAILED`) emit thêm `career.journey.finished` `{ journeyId }`.
  📍 `career.listener.ts` — handler mới enqueue job `generate-readiness-report` vào **`debrief-queue` đã có sẵn** (không tạo queue mới).
  📍 `career.processor.ts` — thêm nhánh xử lý job `generate-readiness-report` (cạnh nhánh `generate-offer-debrief` hiện có, cùng 1 processor), gom dữ liệu như trên, gọi Gemini, `upsert` `JourneyReadinessReport`.
  Endpoint mới `GET /career/journeys/:id/readiness-report` — đọc thuần, không tự trigger generate (đúng pattern `getStageDigest`).

- [ ] **FE**
  📍 `career-journey-page.tsx` — khi journey vừa đóng (PASSED/FAILED), trước khi quay về màn chọn track, hiện section/dialog mới `readiness-report-card.tsx` — poll nhẹ hoặc lắng nghe socket `career_readiness_report_ready` (thêm vào `use-career-socket.ts`) hiện nội dung report ngay khi có.

**Verify khi implement**: hoàn thành trọn 1 track (PASSED tất cả stage qua auto-grade thật P4-P6, cố ý tạo vài lần retry + vài `Submission` sai thuộc 1 tag cụ thể trước đó) → xác nhận job chạy, report sinh ra phản ánh đúng dữ liệu thật: đúng tag yếu đã cố tình tạo, đúng số lần retry, đúng xu hướng confidence.

**P4-P7 hoàn thành khi**: cả 4 phase có BE+FE thật, verify bằng dữ liệu/tài khoản thật qua Chrome (không chỉ code review) — đúng chuẩn đã áp dụng cho toàn bộ P0-P3 trước đó.

---

## Ghi chú thứ tự ưu tiên

DB → BE → FE trong từng phase, giữ đúng lý do đã áp dụng xuyên suốt roadmap này: FE cần contract API thật để gọi, tránh mock rồi sửa lại.

P4 đứng đầu vì sửa đúng 2 lỗ hổng nông nhất (auto-grade, persona) với chi phí thấp nhất (không cần model/DB lớn, không đụng module ngoài `career`/`ai`) — nền tảng `autoGradeStage`/retry mà P5-P7 đều dùng lại. P5 phụ thuộc trực tiếp cơ chế retry của P4, thêm liên kết Quest thật + chọn bài thích ứng. P6 phụ thuộc `autoGradeStage` từ P4 nhưng độc lập với P5 (có thể làm song song nếu cần) — tái dùng nguyên hạ tầng P3 (Live Co-Interview) nên rủi ro chủ yếu nằm ở việc gọi đúng module đã có, không phải xây mới. P7 luôn đứng cuối vì cần dữ liệu attempt/weak-tag/confidence sinh ra từ chính P4-P6 mới có gì để tổng hợp — làm trước sẽ không có dữ liệu thật để verify.
