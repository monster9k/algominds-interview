---
name: add-socket-event
description: Dùng khi cần thêm 1 sự kiện Socket.io mới, nối end-to-end từ backend gateway đến hook frontend và cập nhật UI — vd "thêm event thông báo khi có người mới join session", "emit tiến độ chấm điểm real-time".
---

# Thêm 1 Socket.io event end-to-end

## Khi nào dùng
Cần thêm realtime event mới giữa backend và frontend, theo mô hình đã có của `session_status_update` và `code_evaluation_complete` (mô tả trong `CLAUDE.md` mục "End-to-end session flow").

## Các bước

1. **Backend — nơi emit**:
   - Nếu event phát ra ngay trong 1 request/service đồng bộ: emit trực tiếp qua gateway trong `server/src/modules/chat/chat.gateway.ts` (hoặc gateway liên quan).
   - Nếu event là kết quả của job nền (giống AI evaluation): emit từ `*.listener.ts` sau khi job hoàn thành trong `ai` module — theo đúng pattern `ai.listener.ts` đang emit `code_evaluation_complete`.
   - Đặt tên event snake_case, mô tả rõ hành động (`<domain>_<action>`), nhất quán với `session_status_update`, `code_evaluation_complete` đã có.

2. **Frontend — nơi lắng nghe**:
   - Thêm listener trong hook socket hiện có (`client/src/features/interview/hooks/use-interview-socket.ts`) nếu event thuộc phạm vi interview room, hoặc tạo hook riêng nếu thuộc feature khác — theo pattern `use-evaluation.ts`/`use-session.ts`.
   - Cập nhật state/cache tương ứng khi nhận event (invalidate TanStack Query cache hoặc cập nhật state cục bộ) — không tạo Zustand store mới cho dữ liệu server-driven.

3. **Kiểm tra optimistic lock** — nếu event liên quan đến transition phase của `Session`, xác nhận `Session.version` đã được tăng đúng trước khi emit (xem `.claude/rules/workflow.md`).

4. **Test thủ công**: chạy `docker-compose up -d`, `npm run start:dev` (server) và `npm run dev` (client), tạo 1 session thật, trigger hành động gây ra event, xác nhận UI cập nhật đúng qua devtools/console — repo chưa có test tự động cho luồng socket.
