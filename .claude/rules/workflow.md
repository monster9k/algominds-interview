# Workflow — quy trình làm việc trong repo AlgoMinds

> File này được import tự động vào Claude qua dòng `@rules/workflow.md` ở cuối `CLAUDE.md` gốc.
> Không cần đọc thủ công — Claude sẽ tự load mỗi khi bắt đầu phiên làm việc trong repo này.

## Git & PR
- Nhánh feature đặt tên `feat/<ten-tinh-nang>`, bugfix `fix/<mo-ta-ngan>`.
- Merge vào `main` qua Pull Request (xem lịch sử: các PR gần nhất đều đi qua flow "Merge pull request #N").
- Không tạo commit rỗng, không amend commit đã merge/push.
- Trước khi đề xuất `git push --force`, luôn hỏi lại user — không tự ý force-push.

## Luồng phiên phỏng vấn (Session lifecycle)
Đây là trục chính của toàn bộ sản phẩm — mọi thay đổi liên quan `sessions`, `chat`, `ai`, `judge` module cần đối chiếu lại luồng này:

1. `PHASE_1_STRATEGY`: user nhắn chiến lược qua socket → job vào `ai-queue` → Gemini chấm → nếu `APPROVED`, session chuyển `PHASE_2_IMPLEMENT`, emit `session_status_update`.
2. `PHASE_2_IMPLEMENT`: user code trên Monaco → `POST /judge/submit` → Piston chạy test case → nếu `ACCEPTED`, job `evaluate-code` được queue → Gemini chấm code → emit `code_evaluation_complete`.
3. `Session.version` là optimistic-lock field — **luôn tăng khi chuyển phase**, không bỏ qua bước này khi sửa `sessions.service.ts`.
4. `SessionEvent` là audit trail append-only — mọi transition quan trọng nên ghi lại 1 event, không sửa/xoá event cũ.

## Testing
- Coverage vẫn còn rất mỏng: chỉ có `auth/auth.service.spec.ts` và `judge/judge.service.spec.ts` (ngoài stub e2e mặc định của NestJS) — bám theo style 2 file này khi viết test mới cho module khác.
- Mọi module khác (`sessions`, `chat`, `ai`, `quest`...) vẫn chưa có regression safety net. Khi sửa `judge.service.ts` hoặc `auth.service.ts`, cẩn thận gấp đôi bình thường: đọc kỹ luồng hiện tại trước khi đổi, chạy `.spec.ts` tương ứng và cân nhắc bổ sung test nếu thay đổi logic nhạy cảm (chấm điểm, xác thực).
- Chạy `npm run lint` (client & server) trước khi coi 1 thay đổi là "xong".

## forwardRef() — không tự ý "fix"
`AiModule` và `ChatModule` phụ thuộc vòng lẫn nhau qua `forwardRef()` (chat dispatch job AI; AI cần gateway để emit kết quả về). Đây là cycle **có chủ đích, chấp nhận được** — không refactor để "dọn" nó như một side-effect của việc khác.
