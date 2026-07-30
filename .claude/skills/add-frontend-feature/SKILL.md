---
name: add-frontend-feature
description: Dùng khi cần tạo 1 feature folder mới trong client/src/features/ (trang mới, gọi API mới, hiển thị dữ liệu mới) theo đúng convention feature-folder đã có — vd "thêm trang leaderboard", "thêm tab thống kê mới".
---

# Thêm feature folder frontend mới

## Khi nào dùng
User yêu cầu thêm 1 khu vực chức năng mới trên client (thường gắn với 1 route/trang mới). Không dùng cho việc thêm 1 component nhỏ vào feature đã có sẵn.

## Các bước

1. **Chọn feature mẫu để bám theo** (đọc `.claude/rules/design.md` trước):
   - Đơn giản, chủ yếu hiển thị dữ liệu: `client/src/features/users/`
   - Có socket realtime: `client/src/features/interview/`

2. **Tạo thư mục** `client/src/features/<ten-feature>/`, chỉ tạo các thư mục con thực sự cần:
   - `types/index.ts` — định nghĩa type trước tiên
   - `api/<ten-feature>-api.ts` — hàm gọi backend, không chứa hook
   - `hooks/use-<ten>.ts` — bọc TanStack Query quanh hàm ở `api/`
   - `components/` — component UI thuần của feature
   - `pages/<ten-feature>-page.tsx` — compose lại thành trang hoàn chỉnh

3. **Đăng ký route** — thêm page mới vào router (tìm nơi các page khác được đăng ký, ví dụ theo cách `problems-page.tsx`/`profile-page.tsx` đã được wire).

4. **State**: dữ liệu từ backend → TanStack Query (không đẩy vào Zustand). Chỉ tạo Zustand store mới nếu thực sự có client-only state cần chia sẻ giữa nhiều component.

5. **Build & lint**: `npm run build` (chạy `tsc -b` trước) và `npm run lint` trong `client/` — sửa hết lỗi type trước khi báo hoàn thành.

## Lưu ý
- Không copy nguyên `layout/` hay `utils/` từ feature mẫu nếu feature mới không cần — tránh thư mục rỗng vô nghĩa.
- Với UI, ưu tiên compose từ component có sẵn trong `shadcn/ui` (`client/src/components/ui/`) trước khi viết component mới từ đầu.
