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
- Ví dụ store hợp lệ trong feature: `quest/stores/use-quest-session-store.ts` — quản lý state ván chơi đang chạy (score, combo, lives, time left), đây là state cục bộ thật sự chứ không phải cache dữ liệu server nên không vi phạm quy tắc trên.

## i18n
- `client/src/lib/i18n` dùng `react-i18next`. File dịch tách theo feature: `locales/<en|vi|ja>/<feature>.json` (`common`, `auth`, `interview`, `problems`, `quest`, `settings`, `users`).
- Thêm UI text mới → thêm key vào đúng file feature ở **cả 3 locale**, không gộp vào 1 catalog chung.

## Gu thiết kế (Design Taste)

Task UI có quy mô đáng kể (trang mới, redesign 1 section, component nhìn thấy được lần đầu) → gọi skill `frontend-design` (`.claude/skills/frontend-design/`, vendor nguyên văn từ `anthropics/claude-code`, tác giả Prithvi Rajasekaran & Alexander Bricken) để chạy đúng quy trình brainstorm → plan → critique → build → critique thay vì generate thẳng. Sửa nhỏ (thêm 1 cột, đổi text, thêm nút vào bảng có sẵn) thì không cần — chỉ bám pattern đã có bên dưới.

**Nhận diện thương hiệu hiện có** (`client/src/app/index.css`) — đây là quyết định đã chốt, không tự ý đổi khi task không yêu cầu rebrand:
- Primary `#e11d48` (rose-600), xuyên suốt cả light/dark theme.
- Dark theme kiểu OLED: `--background: #09090b`, `--card: #18181b` — không phải 1 trong 3 kiểu "AI-slop mặc định" mà skill `frontend-design` liệt kê (cream+serif, near-black+acid-green, broadsheet hairline), nhưng cũng đã là nền tối gọn sẵn — đừng đẩy accent sang acid-green hay chêm gradient tuỳ hứng "cho nổi bật".
- Font Inter, sans-serif; `--radius: 0.5rem`; border nhạt (`#27272a` dark / `#e4e4e7` light) — giữ nhất quán, mỗi component không tự bo góc/viền theo kiểu riêng.

**Pattern màu badge đã thiết lập — tái dùng, không bịa bảng màu mới mỗi lần thêm badge:**
Công thức `bg-{color}-500/10 text-{color}-500 border-{color}-500/20`, xem `DIFFICULTY_BADGE_CLASS` (`admin-problems-table.tsx`), `ACTION_BADGE_CLASS` (`admin-audit-log-table.tsx`), `STATUS_BADGE_CLASS` (`contest-table.tsx`). Quy ước ngữ nghĩa: teal = tốt/dễ/tạo mới, yellow = trung bình/cập nhật, red = khó/xoá. Sidebar active-state dùng `border-l-2 border-primary bg-primary/15 text-primary` (`itemClasses()` trong `admin-sidebar.tsx`/`dashboard-sidebar.tsx`) — không đổi sang kiểu highlight khác khi thêm sidebar mới.

**Tránh cụ thể cho stack này** (bổ sung góc nhìn riêng cho AlgoMinds, ngoài phần "3 kiểu mặc định" của skill `frontend-design`):
- Không thêm gradient tím/xanh dương ngẫu nhiên vào button/card — không nằm trong bảng màu đã chọn.
- Không thêm shadow đổ nặng (`shadow-xl`, `shadow-2xl`) tràn lan — UI hiện tại phẳng, dựa vào border + độ tương phản nền/card, không dựa vào shadow.
- Không dùng emoji làm icon trong UI thật — chỉ `lucide-react` (đã import sẵn khắp app); emoji chỉ chấp nhận được trong nội dung do user nhập (vd bài Discuss).
- Bảng data table admin đã có khuôn skeleton/error/empty cố định (xem `admin-audit-log-table.tsx`) — bám đúng khuôn này, không tự sáng tạo loading state riêng mỗi bảng.

## Screenshot/browser QA — bắt buộc khi sửa UI có thể nhìn thấy được

Đã là hành vi mặc định, ghi tường minh ở đây để không bỏ qua ở phiên sau:
- Sau khi sửa/thêm UI → **luôn** dùng Chrome tool (`claude-in-chrome`) chụp/tương tác thật để xác nhận trước khi báo "xong" — tsc/lint pass không thay thế được việc nhìn thấy UI thật chạy đúng.
- Test golden path + ít nhất 1 edge case liên quan trực tiếp tới thay đổi (empty state, loading, error) nếu task đụng tới nó.
- Màn hình đủ quan trọng (trang mới, layout mới) → thử thêm ở viewport nhỏ (~375–420px) để bắt lỗi overflow/wrap — "responsive xuống tận mobile" là 1 phần quality floor theo skill `frontend-design`, không phải optional.
- Lỗi console phát hiện lúc verify mà do chính thay đổi của mình gây ra → fix trước khi coi task hoàn tất, không bỏ qua vì "không liên quan việc đang làm".
