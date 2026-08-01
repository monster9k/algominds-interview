# 🗺️ AlgoMinds — Production Readiness Roadmap

> Bản roadmap trước (audit 2026-07-30) đã hoàn thành 100% (toàn bộ mục P0/P1/P2 đều đã checked off) — xem lịch sử git nếu cần tham chiếu lại nội dung cũ.
> Bản này thay thế nó, tập trung vào 3 bug/gap phát hiện ngày **2026-08-01** khi khảo sát trực tiếp luồng chấm code (judge) và dropdown profile.

## Cách đọc file này
- `🔴 P0` — Khẩn cấp & cốt lõi: chặn chức năng chấm bài hoạt động đúng.
- `🟡 P1` — Quan trọng: ảnh hưởng trải nghiệm nhưng không chặn luồng core.
- Mỗi task có ghi chú **vị trí code** liên quan để bắt tay vào làm ngay.

---

## 🔴 P0 — Khẩn cấp & Cốt lõi

- [x] **Driver C++ hardcode kiểu trả về `vector<int>`, mọi bài không phải Two Sum đều lỗi compile**
  `generateCppDriver()` chỉ định nghĩa 1 overload `printVector(const vector<int>&)` và gọi thẳng `printVector(result)` trong `main()`, nên bài nào có hàm trả về kiểu khác (vd Valid Parentheses trả `bool`) sẽ lỗi `invalid initialization of reference of type 'const std::vector<int>&' from expression of type 'bool'`.
  📍 `server/src/modules/judge/services/code-generator.service.ts` (hàm `generateCppDriver`).
  **Đã fix**: thay 1 hàm `printVector` cứng bằng tập overload `printResult(...)` cho `bool`/`int`/`long long`/`double`/`string`/`vector<int>`/`vector<string>`/`vector<vector<int>>`, C++ tự chọn overload đúng theo kiểu tĩnh của `result` lúc compile — output vẫn giữ định dạng JSON-parseable (`judge.service.ts` dùng `JSON.parse` để so sánh kết quả).

- [x] **TypeScript compile lỗi `TS2583: Cannot find name 'Map'`**
  Piston chạy `tsc *.ts` không có `--target`/`--lib` tường minh (`piston_src/packages/typescript/5.0.3/compile`), nên rơi về default cũ thiếu khai báo ES2015+ (`Map`/`Set`...). Piston không có field payload chung để truyền compiler flags (khác run-stage `args`), và container thực tế chạy image `ghcr.io/engineer-man/piston` có sẵn (không build từ `piston_src/` — thư mục này bị gitignore, sửa vào đó không có tác dụng và không được commit).
  📍 `server/src/modules/judge/services/code-generator.service.ts` (hàm `prepareRunnableCode`, nhánh `typescript`).
  **Đã fix**: prepend triple-slash directive `/// <reference lib="es2022" />` vào đầu code TypeScript trước khi đưa qua `generateJsDriver` — thêm khai báo type cho 1 file cụ thể mà không cần tsconfig/CLI flag, không đổi hành vi runtime (Node luôn có `Map` bất kể `target` của tsc). Nhánh `javascript` giữ nguyên, không đổi.

---

## 🟡 P1 — Quan trọng

- [x] **Dropdown profile hiển thị "Guest" thoáng qua + avatar placeholder tĩnh thay vì dữ liệu user thật**
  `UserNavMenu` vốn đã đọc đúng `useAuthStore` và gắn đúng `logout` — phần đó không lỗi. Gap thật: (1) chỉ đọc `user` từ store (JWT-decode, có thể thiếu `name` ngay sau khi F5 trang cho tới khi query `/users/me` resolve) mà không merge với `useUserProfile()` như `profile-info-card.tsx` đã làm; (2) avatar fallback về URL ngoài cứng `https://github.com/shadcn.png` thay vì dùng `AvatarFallback` chữ cái đầu sẵn có.
  📍 `client/src/components/layout/user-nav-menu.tsx`.
  **Đã fix**: thêm `useUserProfile()`, merge `name`/`avatarUrl` theo thứ tự ưu tiên `profile → store user → "Guest"` (đúng pattern `profile-info-card.tsx`), bỏ fallback avatar URL cứng, dùng chữ cái đầu của `name` cho `AvatarFallback`.
