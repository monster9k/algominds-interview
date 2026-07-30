---
name: add-nestjs-module
description: Dùng khi cần tạo 1 module backend NestJS mới trong server/src/modules/ (CRUD API, guard, DTO) theo đúng convention đã có trong repo AlgoMinds — vd "tạo module quản lý tags", "thêm API cho leaderboard".
---

# Thêm module NestJS mới

## Khi nào dùng
User yêu cầu thêm 1 domain/resource backend mới (có controller + service + Prisma model liên quan). Không dùng cho việc sửa nhỏ trong module đã có.

## Các bước

1. **Chọn module mẫu để bám theo** — đọc 1 trong các module hiện có tuỳ độ phức tạp cần:
   - Đơn giản (CRUD cơ bản): `server/src/modules/users/`
   - Có DTO nhiều field + validate: `server/src/modules/problems/` hoặc `sessions/`
   - Cần role-gate: xem cách `problems.controller.ts` dùng `@Roles('ADMIN')` cho `POST /problems`

2. **Tạo thư mục** `server/src/modules/<ten-module>/` với thứ tự file:
   - `dto/` — class-validator DTO cho create/update trước (đảm bảo tư duy rõ input trước khi viết service)
   - `<ten-module>.module.ts`
   - `<ten-module>.service.ts` — logic + gọi `PrismaService`
   - `<ten-module>.controller.ts` — route handler, áp `JwtAuthGuard`/`RolesGuard` nếu cần

3. **Đăng ký module** vào `server/src/app.module.ts` (import vào mảng `imports`).

4. **Nếu cần model Prisma mới** — dừng lại, dùng skill `add-prisma-model` trước khi viết service.

5. **Build & lint kiểm tra**: `npm run build` và `npm run lint` trong `server/` — sửa lỗi type trước khi báo hoàn thành.

## Lưu ý
- Repo chưa có test suite — không tự ý bỏ qua bước đọc code hiện có, vì không có safety net để bắt lỗi hồi quy.
- Không tạo abstraction/service layer thừa nếu module chỉ cần CRUD đơn giản như `users`.
