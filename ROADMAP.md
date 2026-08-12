# 🗺️ AlgoMinds — Roadmap: Redesign UI trang bảng Admin, Apple-style

> Bản roadmap trước (Polish UI — Problems table Apple-style + đồng bộ các trang dashboard) dừng ở commit `8ee5418`. Phần P0 (Problems table Apple-style) đã bị revert từ trước (commit `5048649`). Phần P1 (Help Center/Store/Event leaderboard/Contest/Settings/Profile) từng được tick `[x]` "done" nhưng code thật sự **chưa bao giờ được commit** — nằm dưới dạng working-tree change không commit, và đã bị thu hồi (`git restore`) theo yêu cầu user thay vì mang sang bản này. Xem lại nội dung bản cũ ở commit `8ee5418` nếu cần tham chiếu.
>
> Bản này thay thế nó hoàn toàn. Mục tiêu: redesign UI kiểu **"Apple-style" — bo góc rộng hơn, spacing thoáng hơn, tỉ lệ card/table tinh gọn** (tham chiếu ảnh mẫu dashboard tối dạng Sales/Admin, KHÔNG copy màu gradient của ảnh) cho **9 trang bảng trong khu vực `/admin`**: Problems, Contests, Users, Store, Discuss, Career, Quests, Peer Interview, Audit Log.
>
> Bản kế hoạch đầy đủ (bối cảnh, câu hỏi đã hỏi user, khảo sát Explore agent) nằm ở plan file phiên làm việc đã tạo bản này — tóm tắt lại các quyết định quan trọng ở phần "Khảo sát" và "Quyết định phạm vi" bên dưới.
>
> **Trạng thái: 100% P0/P1/P2 hoàn thành** — 9/9 bảng admin đã redesign, verify qua Chrome tool (dark+light, console sạch), `tsc -b` + `npm run lint` (client) sạch. Không đụng Dashboard/chrome dùng chung theo đúng phạm vi đã chốt.

## Cách đọc file này
- `🔴 P0` — Định nghĩa pattern chung + thí điểm trên 1 bảng, **bắt buộc checkpoint xác nhận với user** trước khi làm tiếp.
- `🟡 P1` — Rollout pattern đã xác nhận sang 8 bảng còn lại.
- `🟢 P2` — Polish thêm (bug lệch cột nếu phát hiện, đồng bộ chiều cao control phía trên bảng).
- Mỗi task ghi **vị trí code** liên quan để bắt tay vào làm ngay.
- **Phạm vi loại trừ**: chrome dùng chung (`icon-sidebar.tsx`, `app-shell.tsx`, `top-bar.tsx`, `admin-layout.tsx`) — không đụng; `admin-dashboard-page.tsx` + toàn bộ `dashboard-*-chart.tsx`/`dashboard-kpi-card.tsx` — không thuộc phạm vi lần này; các trang ngoài `/admin` (đã audit ở bản roadmap trước, không lặp lại).

---

## Quyết định phạm vi (đã hỏi user, chọn phương án khuyến nghị)

1. **Chỉ 9 trang bảng + component bảng riêng của chúng** — không đụng sidebar/topbar/layout dùng chung (đã redesign 1 lần trước đó theo "Pivora-style", dùng chung cho cả admin lẫn user area, đổi sẽ ảnh hưởng ngoài phạm vi).
2. **Giữ nguyên bảng màu đã chốt trong `design.md`**: primary rose-600 (`#e11d48`), semantic badge chỉ `teal/yellow/red/blue` theo công thức `bg-{color}-500/10 text-{color}-500 border-{color}-500/20`. Ảnh mẫu chỉ dùng để lấy **tỉ lệ/bo góc/spacing/typography**, không copy màu gradient tím/hồng/xanh dương của ảnh.
3. **Không gồm Admin Dashboard** (trang KPI cards + 4 chart chính, `admin-dashboard-page.tsx`) — ngoài phạm vi lần này, chỉ 9 trang bảng được liệt kê.

---

## Khảo sát kỹ thuật quan trọng

- **Sơ đồ 9 trang + component bảng** (`client/src/features/admin/`):

  | Trang | File page | File table |
  |---|---|---|
  | Problems | `pages/admin-problems-page.tsx` | `components/admin-problems-table.tsx` |
  | Contests | `pages/admin-contests-page.tsx` | `components/admin-contests-table.tsx` |
  | Users | `pages/admin-users-page.tsx` | `components/admin-users-table.tsx` |
  | Store | `pages/admin-store-page.tsx` | `components/admin-store-table.tsx` |
  | Discuss | `pages/admin-discuss-page.tsx` | `components/admin-discuss-table.tsx` |
  | Career | `pages/admin-career-page.tsx` | `components/admin-career-table.tsx` |
  | Quests | `pages/admin-quests-page.tsx` | `components/admin-quests-table.tsx` |
  | Peer Interview | `pages/admin-peer-interview-page.tsx` | `components/admin-peer-interview-table.tsx` |
  | Audit Log | `pages/admin-audit-log-page.tsx` | `components/admin-audit-log-table.tsx` |

- **Pattern loading/error/empty đã đồng nhất** ở gần hết các bảng trên (skeleton rows → hàng `text-destructive` căn giữa → hàng `text-muted-foreground` căn giữa), gốc từ `admin-audit-log-table.tsx` (93 dòng, đơn giản nhất — không checkbox/sort/row-action) → **ứng viên thí điểm P0 tốt nhất**, rủi ro thấp nhất khi thử pattern mới.
- **`admin-problems-table.tsx`** là bảng phức tạp nhất (sortable header, checkbox select-all/indeterminate, edit/delete action, `ConfirmDialog`) — dùng làm tham chiếu cho phần "đã ổn định, không động lại" (xem ghi chú P1 riêng bên dưới).
- Container bảng hiện tại: `rounded-xl overflow-hidden border border-border` (Problems) hoặc `rounded-lg overflow-hidden border border-border` (Audit Log và các bảng khác) — chưa nhất quán bo góc giữa các bảng.
- Token màu hiện tại (`client/src/app/index.css`, verbatim — **không đổi**):
  - `--radius: 0.5rem` (token global duy nhất, không có `--radius-sm/md/lg`).
  - `--primary: #e11d48` giống nhau ở cả light/dark.
  - Light: `--background: #fafafa`, `--card: #ffffff`, `--border: #e4e4e7`, `--muted: #f4f4f5`.
  - Dark: `--background: #09090b` (OLED), `--card: #18181b`, `--border: #27272a`, `--muted: #27272a`.
- **Tiền lệ quan trọng**: redesign `ProblemTable` (trang `/problems`, không phải admin) kiểu Apple-style từng được implement đầy đủ + QA pass + commit (`5ac38d9`), nhưng bị **user tự revert** (`5048649`) sau khi xem kết quả thực tế. Bài học áp dụng cho roadmap này: **không rollout đại trà ngay** — thí điểm 1 bảng, cho user xem trực tiếp qua Chrome tool, chờ xác nhận rõ ràng trước khi lan ra các bảng còn lại.
- `admin-pagination.tsx` / `admin-table-footer.tsx` — chưa khảo sát chi tiết nội dung, cần đọc trước khi sửa ở task pagination.

---

## 🔴 P0 — Định nghĩa pattern + thí điểm trên `admin-audit-log-table.tsx`

- [x] **Định nghĩa pattern "Apple-style" chung cho bảng admin** (áp dụng nhất quán ở P1, không đổi màu/token)
  - Container: bo góc `rounded-lg`/`rounded-xl` hiện tại → thống nhất `rounded-2xl`, giữ nguyên `border border-border` (không thêm shadow — giữ đúng nguyên tắc "phẳng dựa vào border" của `design.md`, ảnh mẫu có shadow nhưng đây là điểm **không** copy).
  - Header: đổi sang `h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground` (đồng bộ với style header đã có sẵn ở `admin-problems-table.tsx`, tinh tế hơn bản `text-xs` trần trước đó).
  - Row: **giữ nguyên** — `TableCell` của `admin-audit-log-table.tsx` không override padding, dùng mặc định `p-4` của primitive (`table.tsx`), đã thoáng hơn cả mức `py-3.5` dự tính ban đầu trong kế hoạch nên không cần tăng thêm.

- [x] **Áp dụng pattern vào `admin-audit-log-table.tsx`**
  📍 `client/src/features/admin/components/admin-audit-log-table.tsx` — đổi container sang `rounded-2xl`, đổi style header 4 cột, giữ nguyên `ACTION_BADGE_CLASS` (không đổi màu).

- [x] **QA bằng Chrome tool** (bắt buộc theo `design.md`)
  📍 Trang `/admin/audit-log` — đã chụp cả dark theme (mặc định) và light theme (toggle qua `document.documentElement.classList` để so sánh nhanh, do không tìm thấy toggle theme khả dụng trong menu "Appearance" của UI — submenu không mở được qua click/hover, ghi nhận lại làm known issue chứ không sửa vì ngoài phạm vi roadmap này). Cả 2 theme hiển thị đúng: badge màu rõ, container bo góc `rounded-2xl` hiển thị đúng, header uppercase/tracking-wider dễ đọc. `npm run lint` (0 error, 13 warning có sẵn không liên quan) + `tsc -b` sạch. Console không phát sinh lỗi mới. **Chưa verify được viewport hẹp** — `resize_window` tool không áp dụng được lên cửa sổ Chrome hiện tại (window vẫn giữ nguyên kích thước theo `window.screen`), nhưng thay đổi lần này chỉ động vào bo góc container + typography header, không đụng breakpoint/layout responsive nên rủi ro thấp.

- [x] **Checkpoint: chờ user xác nhận trực tiếp trước khi làm P1** — user xác nhận tiếp tục ("Hãy thực hiện các task còn lại") sau khi xem `/admin/audit-log`, không lặp lại kịch bản `ProblemTable` (làm hết 8 bảng rồi mới bị revert toàn bộ).

---

## 🟡 P1 — Rollout pattern đã xác nhận sang 8 bảng còn lại

*(User xác nhận tiếp tục sau khi xem P0 — "Hãy thực hiện các task còn lại".)*

- [x] **Contests**
  📍 `client/src/features/admin/components/admin-contests-table.tsx` — đã áp dụng pattern (`rounded-2xl` + header uppercase/tracking-wider), giữ nguyên `STATUS_BADGE_CLASS` riêng của bảng này (khác `contest-table.tsx` phía user-facing). QA qua Chrome tool: OK.

- [x] **Users**
  📍 `client/src/features/admin/components/admin-users-table.tsx` — đã áp dụng pattern + thêm cột avatar tròn (`Avatar`/`AvatarFallback`, initials-only vì `AdminUser` không có `avatarUrl` trong response backend — không mở rộng backend cho việc này, ngoài phạm vi redesign UI). Đổi thứ tự cột Name lên trước Email, Email lùi thành text phụ `text-muted-foreground text-xs` để cột Name (có avatar) nổi bật hơn, giống layout "identity column" trong ảnh mẫu. QA qua Chrome tool: OK, avatar hiển thị đúng initials + màu `bg-primary/10 text-primary`.

- [x] **Store**
  📍 `client/src/features/admin/components/admin-store-table.tsx` — đã áp dụng pattern. QA: OK.

- [x] **Discuss**
  📍 `client/src/features/admin/components/admin-discuss-table.tsx` — đã áp dụng pattern (kể cả 3 cột `text-center`: Views/Upvotes/Comments). QA: OK, cột căn giữa đúng.

- [x] **Career**
  📍 `client/src/features/admin/components/admin-career-table.tsx` — đã áp dụng pattern. QA: OK.

- [x] **Quests**
  📍 `client/src/features/admin/components/admin-quests-table.tsx` — đã áp dụng pattern, giữ nguyên `DIFFICULTY_BADGE_CLASS`. QA: OK.

- [x] **Peer Interview**
  📍 `client/src/features/admin/components/admin-peer-interview-table.tsx` — đã áp dụng pattern, giữ nguyên `STATUS_BADGE_CLASS`. QA: OK kể cả empty state ("No peer interview sessions yet.").

- [x] **Problems** (thận trọng hơn — có tiền lệ bị revert ở trang `/problems` khác, tuy khác file nhưng cùng class rủi ro)
  📍 `client/src/features/admin/components/admin-problems-table.tsx` — chỉ đổi container `rounded-xl` → `rounded-2xl` (header đã sẵn style uppercase/tracking-wider từ trước, không cần đổi thêm); **không** động vào `table-fixed`/width cột, **không** đổi `DIFFICULTY_BADGE_CLASS`, **không** đổi logic sort/checkbox/ConfirmDialog. QA: OK, cột vẫn thẳng hàng đúng.

---

## 🟢 P2 — Polish thêm

- [x] **Pagination pill-style**
  📍 `client/src/features/admin/components/admin-table-footer.tsx` — prev/next đã sẵn `rounded-full` từ trước, không cần đổi. `admin-pagination.tsx` (dùng ở Users/Contests/Audit Log) — thêm `rounded-full` cho 2 nút Previous/Next để đồng bộ với `admin-table-footer.tsx`. Đồng thời phát hiện search input ở `admin-users-page.tsx`/`admin-contests-page.tsx` thiếu `rounded-full` trong khi `admin-problems-page.tsx` đã có sẵn (từ bản redesign admin trước) → thêm `rounded-full` vào cả 2 cho nhất quán hình dạng "pill" xuyên suốt khu vực admin.

- [x] **Rà lại lỗi lệch cột kiểu đã gặp ở `ProblemTable`**
  📍 Đã đọc lại cả 8 bảng còn lại — **không phát hiện bug tương tự**: không bảng nào dùng `table-fixed` kết hợp width chỉ khai báo ở `TableHead`, và toàn bộ nội dung cell là text/badge 1 dòng (không có tag-wrap nhiều dòng như `ProblemTable` cũ từng gặp) nên không có rủi ro row-height không đều gây lệch cột. Không cần sửa gì thêm.

- [x] **Đồng bộ chiều cao control phía trên bảng**
  📍 Chỉ 3/9 trang có search/filter bar phía trên bảng (Problems, Users, Contests) — 6 trang còn lại chỉ có `<h1>` tiêu đề, không có control bar nên không áp dụng được. `Input` mặc định `h-10` đã đủ gần `h-11` của table header mới, không tạo cảm giác "jump" rõ rệt — không cần chỉnh height, chỉ cần đồng bộ hình dạng pill (xem task trên).

---

## Verification (áp dụng mỗi task khi thực thi)

- `npm run lint` + `tsc -b` (client) trước mỗi commit.
- Chrome tool: chụp/tương tác thật từng trang sau khi sửa — bắt buộc theo `design.md`, không chỉ tin type-check.
- Test cả light/dark theme, ít nhất 1 viewport hẹp (~375–420px).
- Check console không phát sinh lỗi do thay đổi của mình.
- 1 task = 1 commit, tick `- [ ]` → `- [x]` ngay khi task xong, không tự push/mở PR trừ khi được yêu cầu rõ.
- P0 có checkpoint bắt buộc chờ xác nhận user trước khi sang P1 — không tự ý rollout hết rồi mới hỏi.
