# Design — quy ước frontend (client/)

> Import tự động qua `@rules/design.md` trong `CLAUDE.md` gốc.

## Stack
- React 19 + Vite, TanStack Query cho server state, Zustand cho client/UI state (`stores/`).
- shadcn/ui + Tailwind v4 cho UI. Monaco Editor cho phần code trong `interview` feature.
- Path alias `@/` → `client/src/`.

## Cấu trúc feature-folder (đã khảo sát thực tế trong `client/src/features/*`)
Mỗi feature là 1 thư mục con trong `client/src/features/<ten-feature>/`, các thư mục con phổ biến (không phải feature nào cũng có đủ — thêm khi cần, không tạo thư mục rỗng "phòng hờ"):

```
<feature>/
├── api/          # hàm gọi backend (axios/fetch), 1 file *-api.ts, không chứa React hook
├── hooks/        # custom hook dùng TanStack Query bọc quanh api/, tên use-*.ts
├── components/   # component thuần UI của feature này, không dùng chung feature khác
├── pages/        # component cấp route, compose components + hooks lại
├── types/        # types/interface riêng của feature, thường 1 file index.ts
├── utils/        # hàm thuần không phụ thuộc React (format, tính toán)
└── layout/       # layout riêng của feature (nếu có, vd auth có auth-layout.tsx)
```

Ví dụ tham chiếu: `client/src/features/users/` (đủ `api/hooks/components/types/utils`), `client/src/features/auth/` (có thêm `layout/`, `pages/`).

## Quy ước đặt tên
- File component: kebab-case (`badges-card.tsx`, `submission-heatmap.tsx`), export named component PascalCase.
- Hook: `use-<ten>.ts`, ví dụ `use-user-profile.ts`, `use-interview-socket.ts`.
- API layer: `<feature>-api.ts`, ví dụ `users-api.ts`, `sessions-api.ts`, `judge-api.ts`.

## State
- Server state (dữ liệu từ backend) → TanStack Query, không lưu vào Zustand.
- Client/UI state (theme, modal open, form draft) → Zustand store trong `stores/`.
- Socket events → hook riêng lắng nghe (pattern: `use-interview-socket.ts`), cập nhật cache TanStack Query hoặc state cục bộ, không tự ý tạo store Zustand mới cho dữ liệu server-driven.
