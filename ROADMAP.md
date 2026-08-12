# 🗺️ AlgoMinds — Roadmap: Polish UI (Problems table Apple-style + đồng bộ các trang dashboard)

> Bản roadmap trước (Redesign UI — Admin Dashboard + Unified Icon-Sidebar Shell, Pivora-style) đã hoàn thành 100% P0/P1/P2 — xem lịch sử git (commit cuối chỉnh sửa file này: `6dd615232ebdfce0566d46777762c842ecb684ba`) nếu cần tham chiếu lại nội dung cũ. Lưu ý: task "i18n rà soát key phát sinh khi wiring user side" ở bản cũ còn để trống `- [ ]` (không phải bug, chỉ là không phát sinh key mới nào cần thêm) — không thuộc phạm vi bản này.
>
> Bản này thay thế nó. Mục tiêu: (1) sửa lỗi bảng bị lệch cột ở trang `/problems` + nâng cấp thẩm mỹ kiểu "Apple/macOS — tỉ lệ đẹp, căn chỉnh chính xác"; (2) lấy `/problems` làm mẫu chất lượng, áp dụng đồng bộ cho các trang còn lại trong `DashboardLayout`. Không đụng lại phần shell/sidebar/admin dashboard đã xong ở bản roadmap trước.
>
> Bản kế hoạch đầy đủ (bối cảnh, chẩn đoán kỹ thuật, khảo sát 2 Explore agent) nằm ở plan file phiên làm việc — tóm tắt lại các quyết định quan trọng ở phần "Khảo sát" bên dưới.

## Cách đọc file này
- `🔴 P0` — Trọng tâm chính theo đúng yêu cầu user: sửa lệch cột + nâng cấp `ProblemTable` (`client/src/features/problems/components/problem-table.tsx`) kiểu Apple-style.
- `🟡 P1` — Sửa các lỗi/inconsistency cụ thể đã phát hiện qua khảo sát (bug thật hoặc rõ ràng "chưa xong") ở các trang còn lại.
- `🟢 P2` — Polish thêm giá trị thấp hơn/rủi ro-diff lớn hơn (tách component dùng chung, refactor file lớn, dọn raw-color/raw-input).
- Mỗi task ghi **vị trí code** liên quan để bắt tay vào làm ngay.
- **Phạm vi loại trừ**: `/admin/*` (đã redesign xong, không đụng lại); 4 trang full-screen workspace (Interview Room, Contest Solve, Peer Interview Room, Session Replay) — layout riêng chủ đích, không dùng `AppShell` chrome, không thuộc "match /problems style".

---

## Khảo sát kỹ thuật quan trọng (ảnh hưởng thiết kế)

- **Chẩn đoán lỗi lệch ở `ProblemTable`**: width chỉ set ở `TableHead` (`w-[50px]/w-[400px]/w-[120px]/w-[100px]`), không set ở `TableCell` tương ứng, và `Table` primitive (`client/src/components/ui/table.tsx`) không dùng `table-fixed` → browser tự co giãn cột theo nội dung dài nhất trong bất kỳ hàng nào → header/body trôi lệch. Cột status (icon) thiếu wrapper căn giữa. Cột title thiếu `min-w-0`, tag row wrap nhiều dòng làm row height không đều. Cột solution rỗng khi không có nút → width trôi giữa các hàng.
- Container bọc bảng hiện chỉ là `<div className="rounded-lg overflow-hidden">` trần — không border/card, không có khung kiểu "grouped list" (Finder-style).
- Loading state hiện là spinner căn giữa chung chung — chưa có skeleton dạng hàng khớp layout thật (`client/src/components/ui/skeleton.tsx` có sẵn nhưng chưa dùng trong `problem-table.tsx`).
- Filter bar (`ProblemFilters`, `h-8`/`h-9`) lệch nhịp chiều cao với `TableHead` (`h-12` cố định) → cảm giác "jump" giữa filter row và bảng.
- `getDifficultyColor` trong `problem-table.tsx` tô màu chữ trần (`text-teal-500`...) thay vì pattern pill badge đã chốt trong `design.md` (`bg-{color}-500/10 text-{color}-500 border-{color}-500/20`, tiền lệ ở `DIFFICULTY_BADGE_CLASS` trong `admin-problems-table.tsx`).
- **`/problems` không có `<h1>`** — "header" là `FeatureBanners` (grid banner promo). Các trang khác dùng 2 idiom hero khác nhau: gradient hero box (Quest/Career/Peer-Interview lobby) hoặc plain inline header icon+title (Store/Contests/Discuss/Help Center/Event leaderboard). **Không ép về 1 kiểu header duy nhất** — giữ nguyên idiom mỗi trang, chỉ nâng chất lượng thực thi (spacing rhythm, Card container, control height, skeleton, sửa lỗi cụ thể).
- **13 route con của `DashboardLayout`** đã khảo sát đủ (Quest, Store, Contests list+detail, Career journey+event leaderboard, Peer Interview lobby, Discuss list+detail, Profile, Settings, Help Center) — mỗi trang có mức hoàn thiện khác nhau, liệt kê cụ thể ở P1/P2 bên dưới.
- **4 trang full-screen KHÔNG thuộc `DashboardLayout`** (Interview Room, Contest Solve, Peer Interview Room, Session Replay) — workspace `h-screen` IDE-style, layout riêng chủ đích, loại khỏi phạm vi pass này (trừ 1 sửa nhỏ optional ở P2).
- **Table primitive dùng chung** (`client/src/components/ui/table.tsx`) — chỉ sửa cách dùng tại `problem-table.tsx`, không sửa primitive, để tránh vỡ các bảng khác chưa trong scope (admin tables, contest tables).

---

## 🔴 P0 — Problems table: sửa lệch + Apple-style

- [x] **FE: `table-fixed` + width khớp Head/Cell cho `ProblemTable`**
  📍 `client/src/features/problems/components/problem-table.tsx` — thêm `table-fixed` trên `<Table>`, width khai báo trên `TableHead` (theo spec CSS, `table-fixed` khoá layout theo width hàng đầu tiên = header row) + khai báo lại đúng width trên từng `TableCell` tương ứng (status `w-12`, acceptance `w-24`, difficulty `w-28`, solution `w-16`, title để trống cho tự flex-fill phần còn lại) — không còn cột nào tự co giãn theo nội dung dài nhất.

- [x] **FE: căn giữa cột status + ổn định row height cột title**
  📍 `problem-table.tsx` — bọc icon status trong `flex items-center justify-center`; thêm `min-w-0` + `truncate` cho tiêu đề; giới hạn tối đa 3 tag hiển thị (+N cho phần dư) thay vì để tag row tự do wrap nhiều dòng — giữ mọi hàng cùng 1 nhịp chiều cao mà không cần ép cứng `h-16` (verify qua browser thật: hàng có 1/2/3 tag đều cao bằng nhau).

- [x] **FE: cột solution giữ width ổn định dù có/không có nút**
  📍 `problem-table.tsx` — cell solution `w-16`, render `<div className="h-8 w-8" />` giữ chỗ khi không có nút (thay vì để trống hoàn toàn) — width cột không trôi giữa các hàng.

- [x] **FE: bọc bảng trong container kiểu card + đổi difficulty sang pill badge**
  📍 `problem-table.tsx` — đổi `rounded-lg overflow-hidden` trần thành `rounded-xl border border-border bg-card overflow-hidden`; thay `getDifficultyColor` (text màu trần) bằng `DIFFICULTY_BADGE_CLASS` + component `Badge`, đúng công thức `bg-{color}-500/10 text-{color}-500 border-{color}-500/20` (teal=Easy, yellow=Medium, red=Hard) đã có tiền lệ ở `admin-problems-table.tsx`/`admin-quests-table.tsx`.

- [x] **FE: skeleton loading dạng hàng thay spinner chung chung**
  📍 `problem-table.tsx` — thêm `ProblemTableSkeletonRow` dùng `Skeleton` (`components/ui/skeleton.tsx`), render 6 hàng giả đúng tỉ lệ 5 cột ngay trong `<TableBody>` (giữ nguyên header) thay vì tách hẳn ra 1 box spinner riêng như trước — trải nghiệm loading mượt hơn, không "nhảy" layout khi data về.

- [x] **FE: đồng bộ chiều cao filter bar với table header**
  📍 `problem-filters.tsx` (search input/sort button/2 select/tag button) đổi từ `h-9`/`w-9` sang `h-10`/`w-10`; `problem-table.tsx` (`TableHead`, qua `HEADER_CELL_CLASS`) đổi từ mặc định `h-12` xuống `h-10` — cùng 1 nhịp chiều cao xuyên suốt filter row + table header, verify trực quan qua browser thật không còn "jump".

- [x] **QA: verify `/problems` bằng Chrome tool**
  📍 Đã chụp + zoom kiểm tra: cột thẳng hàng đúng ở nhiều độ dài tiêu đề/số tag khác nhau (1-3 tag), cả dark và light theme (toggle qua `document.documentElement.classList.toggle("dark")`), difficulty pill hiển thị đúng màu ở cả 2 theme, console sạch (0 error qua `read_console_messages`). Responsive ~375–420px: **giới hạn công cụ đã ghi nhận từ trước** (`resize_window` không có tác dụng thật trong môi trường này) — verify thay thế bằng code review: `Table` primitive có `overflow-auto` wrapper nên ở viewport hẹp bảng sẽ cuộn ngang thay vì vỡ cột (đúng hành vi mong muốn cho bảng dày đặc, nhất quán với `tsc -b`/`npm run lint` sạch 0 lỗi).

---

## 🟡 P1 — Sửa lỗi/inconsistency cụ thể đã phát hiện ở các trang khác

- [ ] **Help Center: canh giữa nội dung**
  📍 `client/src/features/settings/pages/help-center-page.tsx` — wrapper `max-w-2xl` hiện thiếu `mx-auto`, không được canh giữa ở viewport rộng khác biệt với các trang khác — thêm `mx-auto`.

- [ ] **Store: xử lý ô placeholder trống**
  📍 `client/src/features/store/pages/store-page.tsx` — ô `rounded-xl border bg-muted/30 min-h-56` không có nội dung, trông như unfinished. Xoá bỏ nếu không có nội dung dự kiến, hoặc thay bằng nội dung hợp lý — quyết định khi build dựa trên context xung quanh.

- [ ] **Store: đổi tab dọc tự chế sang `Tabs` component**
  📍 `client/src/features/store/pages/store-page.tsx` — tab dọc bên trái đang hand-rolled bằng button, trong khi `Tabs` component sẵn có đã dùng ở Contests — đổi sang `Tabs` nếu hỗ trợ tốt orientation dọc, giữ nguyên nếu không (đánh giá khi code).

- [ ] **Event leaderboard: bọc bảng trong `Card`**
  📍 `client/src/features/career/pages/event-leaderboard-page.tsx` — bảng hiện không bọc `Card`, trong khi Contest detail bọc leaderboard tương tự trong `Card` — bọc lại cho nhất quán.

- [ ] **Contest: thống nhất max-width list vs detail**
  📍 `client/src/features/contest/pages/contest-list-page.tsx` (`max-w-6xl`) vs `contest-detail-page.tsx` (`max-w-4xl`) — chọn 1 width nhất quán (đề xuất `max-w-6xl` theo list, trừ khi có lý do rõ giữ hẹp hơn).

- [ ] **Settings: đồng bộ spacing + thêm page heading**
  📍 `client/src/features/settings/pages/settings-page.tsx` — đổi `gap-8` thành `gap-6` (khớp chuẩn 2-cột dùng ở Profile/Store/Discuss/Peer-interview lobby); thêm tiêu đề trang (hiện không có `<h1>` nào).

- [ ] **Profile: thêm page heading**
  📍 `client/src/features/users/pages/profile-page.tsx` — trang hiện không có page-level heading, thêm cho nhất quán với các trang khác.

---

## 🟢 P2 — Polish thêm (giá trị thấp hơn, diff lớn hơn — làm sau cùng)

- [ ] **Tách component `stat-tile.tsx` dùng chung**
  📍 Mới `client/src/components/ui/stat-tile.tsx` (hoặc vị trí tương đương) — pattern `rounded-xl border border-border bg-card px-4 py-3` + icon chip đang lặp thủ công ở cả `quest-hub-page.tsx` và `career-journey-page.tsx`, gộp lại dùng chung.

- [ ] **Refactor `career-journey-page.tsx` (578 dòng) thành subcomponent**
  📍 `client/src/features/career/pages/career-journey-page.tsx` — tách timeline/hero/stat-tiles thành subcomponent riêng để dễ bảo trì. Thuần refactor cấu trúc, không đổi UI nhìn thấy được — verify bằng before/after screenshot giống hệt nhau.

- [ ] **Discuss list: đổi container chính sang `Card` primitive**
  📍 `client/src/features/discuss/pages/discuss-list-page.tsx` — container chính hiện là `div` trần `rounded-lg border bg-card`, đổi sang `Card` nếu không có lý do đặc thù cần giữ div trần.

- [ ] **Peer Interview room: đổi input chat sang `Input` component**
  📍 `client/src/features/peer-interview/pages/peer-interview-room-page.tsx` — ô chat dùng raw `<input>`, đổi sang shadcn `Input` cho nhất quán form-control toàn app (trang full-screen ngoài `DashboardLayout`, tách task riêng vì đây là dọn rác nhỏ tiện thể, không thuộc "match /problems style" chính).

- [ ] **(Tuỳ chọn, không bắt buộc) FeatureBanners: cân nhắc quy màu gradient về token**
  📍 `client/src/features/problems/components/feature-banners.tsx` — 4 banner dùng raw color (`emerald-700/950`, `purple-700/950`, `blue-600/950`) thay vì CSS token. Banner promo thường được phép nổi bật hơn UI chuẩn nên có thể giữ nguyên — chỉ đổi nếu user muốn tuyệt đối nhất quán màu sắc. **Không đổi màu primary/accent chính** theo khoá đã chốt trong `design.md`.

---

## Verification (áp dụng mỗi task khi thực thi)

- `npm run lint` + `tsc -b` (client) trước mỗi commit.
- Chrome tool: chụp/tương tác thật từng trang sau khi sửa — bắt buộc theo `design.md`, không chỉ tin type-check.
- Test cả light/dark theme, ít nhất 1 viewport hẹp (~375–420px) cho các trang có layout dạng grid nhiều cột (table dễ vỡ nhất).
- Check console không phát sinh lỗi do thay đổi của mình.
- 1 task = 1 commit, tick `- [ ]` → `- [x]` ngay khi task xong, không tự push/mở PR trừ khi được yêu cầu rõ.
