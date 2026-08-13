# 🗺️ AlgoMinds — Roadmap: Compact premium SaaS density cho Admin Dashboard + Admin Problems

> Bản roadmap trước ("Redesign UI trang bảng Admin, Apple-style") đã **100% hoàn thành** ở commit `82c7f83` — 9/9 bảng admin (Problems, Contests, Users, Store, Discuss, Career, Quests, Peer Interview, Audit Log) đã áp dụng pattern container `rounded-2xl border border-border`, header `h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider`, pill `rounded-full` cho pagination/search. Bản đó **cố tình loại trừ** Admin Dashboard (`admin-dashboard-page.tsx` + `dashboard-*-chart.tsx`/`dashboard-kpi-card.tsx`) khỏi phạm vi. Xem lại nội dung bản cũ ở commit `82c7f83` nếu cần tham chiếu chi tiết.
>
> Bản này **thay thế hoàn toàn**. Mục tiêu: đưa **Admin Dashboard** (`/admin`) và **Admin Problems table** (`/admin/problems`) — 2 trang duy nhất trong phạm vi lần này — lên mức "premium MacBook-native/SaaS desktop": mật độ thông tin cao, spacing/tỉ lệ chặt chẽ, typography chính xác, **visual hierarchy rõ ràng giữa nội dung chính/phụ/analytics phụ** (đối chiếu ảnh mẫu dashboard tối dạng Sales/SaaS). **Không đổi màu thương hiệu/dark theme/`--radius` đã khoá, không đổi bo góc `rounded-2xl` đã chốt ở bản trước, giữ nguyên 100% chức năng/dữ liệu/bảng/chart/filter.**
>
> **Nguyên tắc cốt lõi khác biệt với bản trước**: compact **không phải** scale-down đồng loạt (không nhân mọi giá trị với 1 hệ số nhỏ hơn). Density phải đến từ bố cục có chủ đích, spacing nội bộ chặt hơn, tỉ lệ component tương xứng vai trò, và canh chỉnh (alignment) tốt hơn — xem chi tiết nguyên tắc ở phần "Design principles" bên dưới.
>
> **Trạng thái: 🔴 P0 đang thực hiện — CỔNG DUYỆT BẮT BUỘC, không tự động rollout sang P1 khi chưa có xác nhận rõ ràng của user qua kết quả render thật.**

## Cách đọc file này
- `🔴 P0` — Prototype ngôn ngữ thiết kế trên **1 component** (`dashboard-kpi-card.tsx`), **bắt buộc dừng lại và chờ user duyệt kết quả render thật** trước khi làm bất kỳ task nào của P1/P2.
- `🟡 P1` — Rollout Dashboard: 5 widget còn lại + page shell (chỉ làm sau khi P0 được approve).
- `🟡 P2` — Admin Problems: page + table density pass.
- `🟢 P3` — Tùy chọn, checkpoint riêng: Sidebar/TopBar (chrome dùng chung toàn app) — **phải hỏi lại user trước khi động vào**, vì vượt phạm vi 2 trang đã chốt.
- Mỗi task ghi **vị trí code** (`📍`) liên quan để bắt tay vào làm ngay.
- **Phạm vi loại trừ**: trang `/problems` phía user (`client/src/features/problems/*`) — có tiền lệ bị chính user revert 1 bản redesign Apple-style đầy đủ (commit `5048649` revert `5ac38d9`); `client/src/components/ui/*.tsx` (primitive dùng chung toàn app); `client/src/app/index.css` (token đã khoá).

---

## Quyết định phạm vi (đã hỏi user, chọn phương án khuyến nghị)

1. **Chỉ Admin Dashboard (`/admin`) + Admin Problems table (`/admin/problems`)** — không đụng trang `/problems` phía user.
2. **Giữ nguyên bảng màu/token đã chốt**: primary rose-600 (`#e11d48`), `--radius: 0.5rem`, badge formula `bg-{color}-500/10 text-{color}-500 border-{color}-500/20`, container `rounded-2xl` đã chốt ở bản trước — không re-litigate bo góc.
3. **Không đơn thuần scale-down** — phải tạo visual hierarchy rõ ràng (Primary/Secondary/Tertiary) cho hàng chart+activity+analytics của Dashboard, không phải mọi card cùng 1 trọng lượng thị giác như hiện tại.
4. **P0 là cổng duyệt bắt buộc, không phải checkpoint thông thường** — sau khi implement + commit `dashboard-kpi-card.tsx`, phải DỪNG LẠI, trình bày kết quả render thật, chờ user xác nhận rõ ràng đồng ý hướng thiết kế mới được làm P1. Nếu P0 vẫn giống "bản gốc thu nhỏ đều", phải sửa lại cách tiếp cận trước khi rollout — tránh lặp lại kịch bản revert `ProblemTable`.

---

## Khảo sát kỹ thuật quan trọng

### Dashboard — màn hình Dashboard duy nhất trong app
`/dashboard` phía user chỉ redirect sang `/problems` — không có dashboard riêng. `client/src/features/admin/pages/admin-dashboard-page.tsx`: `space-y-6` → KPI grid 4 cột (`dashboard-kpi-card.tsx`) → hàng chart+activity (`dashboard-sessions-chart.tsx` dùng **recharts** + `dashboard-recent-activity.tsx`) → hàng 3 cột analytics phụ (`dashboard-session-funnel.tsx`, `dashboard-top-companies.tsx`, `dashboard-acceptance-chart.tsx` — 2 cái sau là progress-bar tự chế, không phải chart thật).

Baseline hiện tại: mọi `Card` kế thừa padding mặc định `p-6` (24px, chưa override — nguồn whitespace thừa lớn nhất); `CardTitle` mọi widget đều `text-base` (đồng phục, thiếu phân tầng); KPI value `text-2xl font-bold`; section gap `space-y-6`, grid `gap-4`; chart cao cố định `256px`, đã tokenize màu qua CSS var (`var(--primary)`, `var(--border)`...); badge/delta đúng công thức `bg-{color}-500/10 text-{color}-500 border-{color}-500/20`.

### Admin Problems — `admin-problems-page.tsx` + `admin-problems-table.tsx`
Đã qua 1 lượt Apple-style thận trọng (chỉ đổi `rounded-xl`→`rounded-2xl`, không đụng `table-fixed`/width cột/badge/sort/checkbox). Header bảng đã chuẩn (`h-11 py-2.5 text-[11px] uppercase tracking-wider`). Còn lại: page title `text-2xl` to hơn cần thiết; cell padding `py-3` có thể siết nhẹ; toolbar phía trên bảng (filter trigger, search, nút "Create New") lẫn lộn chiều cao `h-10`/mặc định, chưa đồng bộ `h-11` của header bảng; bulk-select bar `px-4 py-2.5`.

### Design tokens & primitive dùng chung
`--radius: 0.5rem` là token duy nhất, không đổi. Không có token spacing/typography riêng — dùng thang mặc định Tailwind. Không có convention "compact"/"dense" tồn tại sẵn trong codebase. `Card`/`Button`/`Input`/`Table` (`components/ui/*.tsx`) dùng chung toàn app — **không sửa các file này**, chỉ override tại chỗ trong component Dashboard/Problems. Sidebar/TopBar/AppShell dùng chung 100% giữa admin và user — đổi ảnh hưởng toàn app, đưa vào P3 riêng có checkpoint độc lập.

### Tiền lệ rủi ro
Redesign Apple-style đầy đủ cho `ProblemTable` (trang `/problems` phía user) từng được implement + QA pass + commit (`5ac38d9`), nhưng bị **chính user revert toàn bộ** (`5048649`) sau khi xem kết quả thực tế. Bài học: **pilot 1 component, xin xác nhận qua Chrome tool, rồi mới rollout** — không làm hết rồi mới cho xem.

---

## Design principles

### Nguyên tắc cốt lõi — Compact ≠ scale-down đồng loạt
- Density đến từ **bố cục có chủ đích**, **spacing nội bộ chặt hơn**, **tỉ lệ component tương xứng vai trò**, **typography chính xác**, **canh chỉnh (alignment) tốt hơn** — KHÔNG phải nhân mọi giá trị với cùng 1 hệ số nhỏ hơn.
- Giữ khả năng đọc — tránh cảm giác chật chội hoặc "thu nhỏ toàn bộ màn hình". Số liệu quan trọng (KPI value, giá trị chart) vẫn phải đủ nổi bật để đọc nhanh (glanceable).
- Tạo visual hierarchy rõ ràng — không phải mọi card cùng trọng lượng thị giác như hiện tại.
- Không thêm hiệu ứng trang trí, gradient, shadow nặng, hay UI element không phục vụ chức năng.

### Phân tầng visual hierarchy — hàng chart/activity/analytics của Dashboard
| Tầng | Component | Vai trò | Xử lý khác biệt |
|---|---|---|---|
| **Primary** | `dashboard-sessions-chart.tsx` (Sessions Over Time) | Nội dung chính | `CardTitle text-base font-semibold` (không hạ ngang tertiary); chart height giữ ~240px (không ép nhỏ như các tầng khác); padding `p-5`; range-tab 1W/1M/3M/ALL giữ nguyên vị trí/logic. |
| **Secondary** | `dashboard-recent-activity.tsx` | Bổ trợ, đọc lướt theo hàng | `CardTitle text-sm font-semibold`, `p-4`, row gap `space-y-2`. |
| **Tertiary** | `dashboard-session-funnel.tsx`, `dashboard-top-companies.tsx`, `dashboard-acceptance-chart.tsx` | Analytics phụ, list ngắn | `CardTitle text-xs font-medium uppercase tracking-wide text-muted-foreground` (ngôn ngữ label, không phải title), `p-3.5`, row gap `space-y-1.5`. |

KPI row (4 card đầu) không thuộc phân tầng trên — dải "top-line metrics" vai trò ngang nhau, nhưng design language của nó (padding/canh chỉnh, xem P0) là nền tảng cho các tầng khác, không phải bản để copy y nguyên số liệu.

### Typography (theo tầng, không phải giảm đều 1 bậc)
| Vai trò | Hiện tại | Đề xuất |
|---|---|---|
| Page title (Dashboard, Problems) | `text-2xl font-semibold` | `text-xl font-semibold tracking-tight` |
| Card title — Primary | `text-base` | `text-base font-semibold` |
| Card title — Secondary | `text-base` | `text-sm font-semibold` |
| Card title — Tertiary | `text-base` | `text-xs font-medium uppercase tracking-wide text-muted-foreground` |
| KPI value | `text-2xl font-bold` | giữ `text-2xl`, đổi `font-bold`→`font-semibold` (không giảm size — thu nhỏ khoảng trắng xung quanh, không thu nhỏ số) |
| Body/nội dung chính | `text-sm` | giữ nguyên |
| Label phụ/muted | `text-xs` | giữ nguyên |
| Header bảng | `text-[11px] uppercase tracking-wider` | giữ nguyên |

### Spacing & composition (theo tầng, ưu tiên alignment trước khi giảm số)
| Vị trí | Hiện tại | Đề xuất |
|---|---|---|
| KPI card | `p-6` (2 hộp padding chồng: `CardHeader pb-2` + `CardContent p-6 pt-0`) | Cấu trúc lại 1 khối `p-4` duy nhất — icon canh `items-center` cùng baseline title, value+delta `items-baseline`, compare-label `mt-0.5` |
| Card padding — Primary | `p-6` | `p-5` |
| Card padding — Secondary | `p-6` | `p-4` |
| Card padding — Tertiary | `p-6` | `p-3.5` |
| Gap section lớn (`space-y-6` root) | 24px | `space-y-5` |
| Gap KPI grid | `gap-4` | `gap-3` |
| Gap hàng tertiary (3-cột) | `gap-4` | `gap-3` (hàng primary+secondary giữ `gap-4`) |
| Chiều cao control toolbar | lẫn lộn `h-10`/mặc định | thống nhất `h-9`, khớp gần header bảng `h-11` |
| Table header height | `h-11 py-2.5` | giữ nguyên |
| Table cell padding | `py-3` | `py-2.5` |
| Chart height (Primary) | `256px` | `240px` |
| Row gap — Tertiary | `space-y-3`/`space-y-2.5` | `space-y-1.5` |
| Row gap — Secondary | `space-y-3` | `space-y-2` |

**Radius/border/shadow**: giữ nguyên `rounded-2xl` container chính, `rounded-full` pill control, không thêm shadow/gradient/hiệu ứng trang trí. **Màu sắc**: không đổi 1 token/màu nào.

---

## 🔴 P0 — Prototype ngôn ngữ thiết kế trên `dashboard-kpi-card.tsx` — CỔNG DUYỆT BẮT BUỘC

> **Lần 1 bị user từ chối** ("vẫn giống bản gốc thu nhỏ đều, chưa đủ premium/MacBook-native"). Đã rework lại lần 2 theo hướng thay đổi ngôn ngữ thị giác thực sự, không chỉ nén padding — xem chi tiết bên dưới.

- [x] **Recompose `dashboard-kpi-card.tsx` (rework lần 2)**
  📍 `client/src/features/admin/components/dashboard-kpi-card.tsx` — thiết kế lại 3 tầng rõ rệt thay vì bố cục cũ:
  - **Metadata row** (nhẹ nhất): icon `h-3.5 w-3.5 text-muted-foreground/70` + label đổi hẳn sang ngôn ngữ caption `text-[11px] font-medium uppercase tracking-wide text-muted-foreground` (trước là `text-sm` thường), gộp icon+label thành 1 nhóm liền `gap-1.5` (trước icon bị đẩy sang góc phải riêng biệt bằng `justify-between`).
  - **Metric** (nổi bật nhất — tăng, không giảm): `text-3xl` (trước `text-2xl`) `font-semibold leading-none tracking-tight tabular-nums`, đứng riêng 1 dòng (trước value+delta-badge chung 1 hàng cạnh tranh nhau).
  - **Caption row** (nhẹ, gộp lại): delta + compare-label giờ nằm chung 1 dòng nhỏ `text-xs` — delta chỉ còn text màu + icon mũi tên (bỏ hẳn khung `border`+`bg` badge cũ, giảm "nặng nề" thị giác), compare-label muted đứng cạnh cùng dòng (trước tách thành dòng riêng bên dưới).
  - **Card chrome**: border nhẹ hơn `border-border/60` (trước border mặc định đậm hơn), `shadow-none` (bỏ hẳn `shadow-sm` mặc định — bám đúng nguyên tắc "phẳng dựa border" của `design.md`), radius `rounded-xl` (trước `rounded-lg` mặc định) — tinh chỉnh riêng cho nhóm KPI card, không đụng `rounded-2xl` đã khoá của các container bảng/chart.
- [x] **Verify**: `tsc -b` sạch; `npm run lint` 0 error (13 warning có sẵn không liên quan).
- [x] **QA Chrome tool**: `/admin` dashboard — dark + light theme đều hiển thị rõ, số liệu nổi bật, caption gọn, border/radius mềm hơn rõ rệt so với các card khác (Sessions Over Time, Recent Activity...) chưa đổi trên cùng màn hình — tạo đối chiếu trực quan trước/sau. Console sạch cả 2 theme. Viewport hẹp vẫn không verify trực tiếp được do giới hạn `resize_window` tool đã ghi nhận trước đó — rủi ro thấp vì không đụng class breakpoint của grid.
- [x] **Commit riêng cho bản rework**, tick checkbox này trong cùng commit.
- [x] **DỪNG LẠI — trình bày kết quả render thật cho user, chờ xác nhận rõ ràng trước khi làm P1.** User xác nhận đồng ý hướng thiết kế ("Được") kèm 1 yêu cầu nhỏ tiếp theo (bỏ viền 5 widget còn lại — xem task border-removal ở đầu P1 bên dưới) trước khi giao toàn bộ P1.

---

## 🟡 P1 — Rollout Dashboard: 5 widget còn lại + page shell (chỉ làm sau khi P0 được approve)

- [x] **Bỏ viền (`border-0`) trên 5 widget còn lại** — yêu cầu riêng của user sau khi duyệt P0, làm trước phần padding/typography tier bên dưới.
  📍 `dashboard-sessions-chart.tsx`, `dashboard-recent-activity.tsx`, `dashboard-session-funnel.tsx`, `dashboard-top-companies.tsx`, `dashboard-acceptance-chart.tsx` — thêm `border-0` vào `Card`, giữ nguyên `shadow-sm` mặc định (không đụng, user chỉ yêu cầu bỏ viền) và toàn bộ nội dung/logic. QA Chrome tool: dark+light theme đều hiển thị đúng, card giờ chỉ phân định bằng độ tương phản `bg-card`/`bg-background` (không viền), console sạch. KPI card (đã rework riêng) giữ nguyên viền mềm `border-border/60` — không nằm trong yêu cầu bỏ viền lần này.
- [ ] **`dashboard-sessions-chart.tsx` (Primary)**
  📍 padding `p-5`, `CardTitle` giữ `text-base font-semibold`, chart height `256`→`240`, `Tabs`/logic range 1W/1M/3M/ALL giữ nguyên hoàn toàn.
- [ ] **`dashboard-recent-activity.tsx` (Secondary)**
  📍 padding `p-4`, `CardTitle`→`text-sm font-semibold`, row gap `space-y-2`.
- [ ] **`dashboard-session-funnel.tsx`, `dashboard-top-companies.tsx`, `dashboard-acceptance-chart.tsx` (Tertiary)**
  📍 padding `p-3.5`, `CardTitle`→`text-xs font-medium uppercase tracking-wide text-muted-foreground`, row gap `space-y-1.5`. Giữ nguyên toàn bộ badge/màu/logic tính %.
- [ ] **`admin-dashboard-page.tsx`**
  📍 page title `text-2xl`→`text-xl`, `space-y-6`→`space-y-5`, KPI grid `gap-4`→`gap-3`, hàng tertiary `gap-4`→`gap-3`, hàng primary+secondary giữ `gap-4`.
- [ ] **QA Chrome tool**: từng widget, không lệch/tràn ở viewport hẹp, 3 tầng hierarchy phân biệt rõ bằng mắt thường.

---

## 🟡 P2 — Admin Problems: page + table density pass

- [ ] **`admin-problems-page.tsx`**
  📍 title `text-2xl`→`text-xl`; đồng bộ chiều cao toolbar (filter trigger, search input, nút "Create New") về `h-9`; bulk-select bar `py-2.5`→`py-2`.
- [ ] **`admin-problems-table.tsx`**
  📍 cell `py-3`→`py-2.5`. **Không đụng** `table-fixed`, width cột, `DIFFICULTY_BADGE_CLASS`, logic sort/checkbox/`ConfirmDialog`.
- [ ] **`admin-table-footer.tsx`**
  📍 kiểm tra lại chiều cao control sau khi đổi toolbar phía trên, chỉnh nếu lệch — không đổi logic phân trang.
- [ ] **QA Chrome tool**: cột vẫn thẳng hàng, test loading/error/empty/bulk-select.

---

## 🟢 P3 — (Tùy chọn, checkpoint riêng, KHÔNG tự làm nếu chưa hỏi lại) Sidebar/TopBar

`icon-sidebar.tsx`/`top-bar.tsx`/`app-shell.tsx` dùng chung toàn app — đổi ảnh hưởng mọi trang khác (Quest, Contest, Store...). Đề xuất nếu được làm: `TopBar`/sidebar header `h-14`→`h-12`, sidebar nav item `py-2`→`py-1.5`, `AppShell` main padding `p-6 md:p-8`→`p-5 md:p-6`. **Phải hỏi lại user xác nhận rõ ràng trước khi động vào.**

---

## Verification (áp dụng mỗi task khi thực thi)

- `npm run lint` + `tsc -b` (client) trước mỗi commit.
- Chrome tool bắt buộc: chụp/tương tác thật, dark + light, viewport ~375-420px, console sạch.
- Xác nhận không mất chức năng: sort/checkbox/bulk-select/pagination/filter (Problems), range-tab 1W/1M/3M/ALL + tooltip chart (Dashboard).
- 1 task = 1 commit, tick `- [ ]`→`- [x]` ngay khi xong, không tự push/mở PR trừ khi được yêu cầu rõ.
- P0 bắt buộc dừng cứng chờ user xác nhận qua kết quả render thật trước khi sang P1 — không rollout hết rồi mới hỏi.
