---
name: add-prisma-model
description: Dùng khi cần thêm hoặc sửa 1 model trong server/prisma/schema.prisma và chạy migration an toàn — vd "thêm bảng Tag", "thêm field mới vào Problem", "cần model cho leaderboard".
---

# Thêm/sửa Prisma model an toàn

## Khi nào dùng
Bất kỳ thay đổi nào vào `server/prisma/schema.prisma` — thêm model mới, thêm field, đổi quan hệ. Đây là thao tác có thể ảnh hưởng dữ liệu thật, cần cẩn thận.

## Các bước

1. **Đọc schema hiện tại trước** — `server/prisma/schema.prisma` — để hiểu convention đặt tên, cách các model liên quan (`Session`, `Evaluation`, `Submission`, `SessionEvent`) tham chiếu nhau.

2. **Sửa schema**:
   - Model mới: đặt tên PascalCase số ít, theo đúng style các model hiện có.
   - Nếu model liên quan đến `Session` và có thể bị ghi đồng thời, cân nhắc thêm field kiểu optimistic-lock giống `Session.version`.
   - Nếu là bảng log/audit như `SessionEvent`, thiết kế append-only (không có `updatedAt` cần thiết cho update).

3. **Chạy migration** (từ `server/`):
   ```bash
   npx prisma migrate dev --name <ten-migration-mo-ta-ngan>
   ```
   Xác nhận trước với user nếu đang chạy trên DB có dữ liệu thật quan trọng — migration có thể không reversible dễ dàng.

4. **Cập nhật seed nếu cần** — `server/prisma/seed.ts` — nếu model mới cần dữ liệu mẫu để dev/test.

5. **`npx prisma generate`** để cập nhật Prisma Client types, sau đó kiểm tra `npm run build` ở `server/` không lỗi type.

## Lưu ý an toàn
- Không dùng `prisma db push` cho thay đổi cần lên production — chỉ dùng khi prototyping nhanh ở local, vì nó bỏ qua migration history.
- Không tự ý xoá/đổi kiểu cột đang có dữ liệu mà không hỏi user trước — luôn xác nhận khi thao tác có khả năng mất dữ liệu.
