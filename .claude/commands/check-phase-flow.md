---
description: Tra cứu nhanh trạng thái phase (PHASE_1_STRATEGY/PHASE_2_IMPLEMENT/COMPLETED/ABANDONED) của 1 session, dựa trên Session.status và SessionEvent gần nhất.
---

Tra cứu trạng thái session có id/slug: $ARGUMENTS

Các bước:
1. Nếu có Prisma Studio hoặc kết nối DB sẵn sàng, truy vấn bảng `Session` theo id/slug được cung cấp để lấy `status`, `version`, `updatedAt`.
2. Truy vấn `SessionEvent` liên quan (sắp theo thời gian) để xem lịch sử transition — có bước nào bị nhảy cóc hoặc lặp bất thường không.
3. Nếu không kết nối được DB trực tiếp, đọc code liên quan trong `server/src/modules/sessions/sessions.service.ts` để giải thích luồng transition mong đợi cho id/slug đó, và gợi ý câu lệnh SQL/Prisma Studio để user tự tra.
4. Tóm tắt: session đang ở phase nào, transition gần nhất là gì, có gì bất thường so với luồng chuẩn (@rules/workflow.md mục "Luồng phiên phỏng vấn") không.
