# 🗺️ AlgoMinds — Roadmap: Polish UI (Problems table Apple-style + đồng bộ các trang dashboard)

> Bản roadmap trước (Redesign UI — Admin Dashboard + Unified Icon-Sidebar Shell, Pivora-style) đã hoàn thành 100% P0/P1/P2 — xem lịch sử git (commit cuối chỉnh sửa file này trước bản này: `6dd615232ebdfce0566d46777762c842ecb684ba`) nếu cần tham chiếu lại nội dung cũ.
>
> Bản này thay thế nó. Mục tiêu: (1) sửa lỗi bảng bị lệch cột ở trang `/problems` + nâng cấp thẩm mỹ kiểu "Apple/macOS — tỉ lệ đẹp, căn chỉnh chính xác"; (2) lấy `/problems` làm mẫu chất lượng, áp dụng đồng bộ cho các trang còn lại trong `DashboardLayout`. Không đụng lại phần shell/sidebar/admin dashboard đã xong ở bản roadmap trước.
>
> Bản kế hoạch đầy đủ (bối cảnh, chẩn đoán kỹ thuật, khảo sát 2 Explore agent) nằm ở plan file phiên làm việc — tóm tắt lại các quyết định quan trọng ở phần "Khảo sát" bên dưới.

## Cách đọc file này
- `🔴 P0` — Trọng tâm chính theo đúng yêu cầu user: sửa lệch cột + nâng cấp `ProblemTable` (`client/src/features/problems/components/problem-table.tsx`) kiểu Apple-style. **Đã implement, QA pass, rồi bị revert theo yêu cầu user sau khi xem kết quả thực tế** — xem ghi chú trong mục P0 bên dưới.
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
- **`Tabs` primitive (`components/ui/tabs.tsx`) không render đúng ở `orientation="vertical"`** — phát hiện khi thử áp dụng cho Store: `data-vertical`/`group-data-vertical/tabs:flex-col` không resolve thành CSS thật trong Tailwind v4 setup hiện tại của repo, khiến tab list vẫn nằm ngang thay vì dọc. Đây là bug tiềm ẩn trong primitive dùng chung — **không tự ý sửa** (rủi ro ảnh hưởng mọi chỗ dùng `Tabs` khác trong app, ngoài phạm vi roadmap này), chỉ ghi nhận lại và tránh dùng `orientation="vertical"` cho tới khi primitive được fix riêng.

---

## 🔴 P0 — Problems table: sửa lệch + Apple-style

> **ĐÃ REVERT.** Toàn bộ 7 task bên dưới đã được implement đầy đủ, verify qua Chrome tool (tsc/lint sạch, cột thẳng hàng đúng ở nhiều độ dài tiêu đề/tag khác nhau, dark+light theme, console sạch) và commit (`5ac38d9`). Sau khi xem kết quả trực tiếp, user quyết định **giữ nguyên `ProblemTable`/`ProblemFilters` bản gốc**, không áp dụng redesign này — đã revert bằng commit `5048649` (`git revert 5ac38d9`, không conflict vì P1 không đụng 2 file này). Để lại mô tả task bên dưới làm hồ sơ tham khảo, **không tick lại** trừ khi user yêu cầu làm lại việc này trong tương lai.

- [ ] ~~**FE: `table-fixed` + width khớp Head/Cell cho `ProblemTable`**~~
  📍 `client/src/features/problems/components/problem-table.tsx` — thêm `table-fixed` trên `<Table>`, width khai báo khớp giữa `TableHead` và `TableCell` cho 5 cột.
- [ ] ~~**FE: căn giữa cột status + ổn định row height cột title**~~
- [ ] ~~**FE: cột solution giữ width ổn định dù có/không có nút**~~
- [ ] ~~**FE: bọc bảng trong container kiểu card + đổi difficulty sang pill badge**~~
- [ ] ~~**FE: skeleton loading dạng hàng thay spinner chung chung**~~
- [ ] ~~**FE: đồng bộ chiều cao filter bar với table header**~~
- [ ] ~~**QA: verify `/problems` bằng Chrome tool**~~

---

## 🟡 P1 — Sửa lỗi/inconsistency cụ thể đã phát hiện ở các trang khác

- [x] **Help Center: canh giữa nội dung**
  📍 `client/src/features/settings/pages/help-center-page.tsx` — wrapper đổi từ `max-w-2xl` trần thành `w-full max-w-2xl mx-auto pb-10`, khớp pattern các trang khác (Store/Contest/Event leaderboard). Verify qua browser: nội dung đã canh giữa đúng ở viewport rộng.

- [x] **Store: xử lý ô placeholder trống**
  📍 `client/src/features/store/pages/store-page.tsx` — xoá hẳn `<div className="hidden lg:block rounded-xl border border-border bg-muted/30 min-h-56" />` (không có nội dung dự kiến, không có data source nào trong feature store hợp lý để lấp vào — grep xác nhận không có "featured/promo/daily" nào chưa dùng tới). Giữ nguyên cột trái chỉ còn 2 tab Browse/Inventory.

- [x] **Store: thử đổi tab dọc sang `Tabs` component — revert, giữ bản hand-rolled**
  📍 `store-page.tsx` — đã thử `Tabs orientation="vertical"` nhưng phát hiện primitive không render dọc đúng (xem mục Khảo sát ở trên) — Browse/My Items bị xếp ngang thay vì dọc, vỡ layout cột trái. Đã revert về đúng bản button tự chế ban đầu (không đổi gì thêm), chỉ giữ lại phần xoá placeholder ở task trên.

- [x] **Event leaderboard: bọc bảng trong `Card`**
  📍 `client/src/features/career/pages/event-leaderboard-page.tsx` — bọc `<Table>` trong `<Card><CardContent className="p-0">`, nhất quán với cách Contest detail bọc leaderboard tương tự.

- [x] **Contest: thống nhất max-width list vs detail**
  📍 `client/src/features/contest/pages/contest-detail-page.tsx` — đổi cả 3 chỗ `max-w-4xl` (loading/error/main state) thành `max-w-6xl`, khớp `contest-list-page.tsx`.

- [x] **Settings: đồng bộ spacing**
  📍 `client/src/features/settings/pages/settings-page.tsx` — đổi `gap-8` thành `gap-6`, khớp chuẩn 2-cột dùng ở Profile/Store/Discuss/Peer-interview lobby. **Bỏ qua phần "thêm page heading"** trong mô tả gốc: kiểm tra lại thấy `SettingsSidebar` đã tự render `<h1>{t("sidebar.title")}</h1>` ("Settings") ở đầu cột trái — thêm 1 heading "Settings" nữa ở cột phải sẽ bị trùng lặp text trên màn hình, không phải thiếu sót thật.

- [x] **Profile: thêm page heading**
  📍 `client/src/features/users/pages/profile-page.tsx` — thêm header `icon + h1` (key mới `profile.pageTitle`, thêm cả 3 locale `en/vi/ja` trong `users.json`) phía trên grid 2 cột, nhất quán với Store/Contests/Discuss.

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
