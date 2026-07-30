# Tech defaults — quy ước backend (server/)

> Import tự động qua `@rules/tech-defaults.md` trong `CLAUDE.md` gốc.

## Stack
- NestJS 11, PostgreSQL 16 qua Prisma 7 (driver adapter — không dùng default engine), Redis + BullMQ cho job bất đồng bộ, Socket.io realtime, Google Gemini cho AI evaluation.

## Cấu trúc module (đã khảo sát `server/src/modules/*`)
Mỗi module trong `server/src/modules/<ten-module>/` theo pattern NestJS chuẩn:

```
<module>/
├── <module>.module.ts       # khai báo providers/imports/exports
├── <module>.controller.ts   # route handler, decorator @Roles/@CurrentUser nếu cần
├── <module>.service.ts      # business logic, gọi Prisma
├── dto/                     # class-validator DTO cho request body/query
└── services/ hoặc strategies/  # tách thêm khi module phức tạp (vd judge/services/piston.service.ts, auth/strategies/)
```

Module có xử lý job nền (vd `ai`) có thêm `*.processor.ts` (BullMQ worker) và `*.listener.ts` (lắng nghe queue event để emit qua gateway).

## Guards & decorators (`common/guards`, `common/decorators`)
- `JwtAuthGuard` — bắt buộc đăng nhập. `OptionalJwtAuthGuard` — cho phép cả request không kèm token (vd `GET /problems` để enrich status nếu có user).
- `RolesGuard` + `@Roles('ADMIN')` — gate theo role, dùng kèm `JwtAuthGuard` (vd `POST /problems`).
- `@CurrentUser()` — lấy user từ request đã qua `JwtAuthGuard`, không tự parse JWT thủ công trong controller.

## Prisma
- Driver adapter, không phải Prisma engine mặc định — không thêm cấu hình giả định engine cũ khi tra cứu tài liệu Prisma.
- `Session.version` — optimistic lock, tăng khi transition phase, không bỏ qua.
- `Problem.initialCode` / `solution` / `testCases` là JSON blob keyed theo ngôn ngữ — khi thêm ngôn ngữ mới phải cập nhật đồng bộ ở `PistonService.getLanguageConfig()`.
- `SessionEvent` append-only — không update/delete record cũ.

## Piston (code execution)
`server/src/modules/judge/services/piston.service.ts` đọc `PISTON_API_URL` qua `ConfigService.getOrThrow` (không hardcode URL). Submission Java cần `main: 'Main'` tường minh trong payload vì Piston mặc định chạy class public đầu tiên tìm thấy.

## Không có test suite
Chưa có `.spec.ts` nào ngoài stub mặc định — khi sửa logic nhạy cảm (chấm điểm ở `judge.service.ts`, xác thực ở `auth.service.ts`), đọc kỹ code hiện tại trước, cân nhắc thêm test khi thay đổi lớn.
