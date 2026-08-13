# 🗺️ AlgoMinds — Roadmap: UI + API wiring cho Admin CRUD (Store/Career/Quest/Discuss/Peer Interview)

> Bản roadmap trước ("Admin CRUD endpoints (Store/Career/Quest/Peer Interview) + Discuss comment moderation") đã hoàn thành 100% P0→P4 — CRUD `ShopItem` (`956726a`), `CareerTrack` (`6af6ad9`), `BugSnippet` (`9d69f2f`), ban comment `DiscussComment` (`0610870`), force-abandon `PeerInterviewSession` (`b9f0dae`) — kèm 1 commit UI redesign không liên quan chủ đề (`e3da2cf`). Toàn bộ đã merge vào `main` qua PR #25 (`64caecb`). Backend cho cả 5 domain đã đầy đủ endpoint mutation + audit log, verify bằng curl thủ công, nhưng **frontend admin vẫn hoàn toàn read-only** cho 5 bảng này (đúng ghi chú "ngoài phạm vi" để lại ở mỗi phase P0-P4 cũ).
>
> Bản này **thay thế hoàn toàn** — chủ đề khác hẳn (frontend, không phải backend). Mục tiêu: nối dây UI (dialog form, nút Action, confirm dialog) + hook TanStack Query gọi đúng các endpoint đã có sẵn, để admin thao tác được CRUD thật trên 5 bảng: Store, Career, Quest, Discuss (ban comment), Peer Interview (force-abandon).
>
> **Trạng thái: 🔵 CHỈ LÊN KẾ HOẠCH — chưa viết code.** Theo yêu cầu, dừng lại ở đây để user review, chỉ code khi được yêu cầu rõ (vd "làm P0", "thực hiện roadmap").

## Cách đọc file này
- Thứ tự ưu tiên bám đúng thứ tự domain đã hoàn thành ở backend (P0 Store → P4 Peer Interview) để dễ đối chiếu.
- Mỗi phase liệt kê: **file cần thêm/sửa** (`📍`), **field/API cụ thể**, **hành vi UI kỳ vọng**, và **điểm cần lưu ý** (rủi ro state, endpoint nào có/không có "restore").
- `🔴 P0`/`🟡 P1`/`🟡 P2`/`🟡 P3`/`🟢 P4` — mức độ ưu tiên gợi ý, không phải rủi ro kỹ thuật (khác ý nghĩa `🔴` ở bản roadmap backend cũ — lần này không có migration nên không phase nào thực sự "rủi ro cao").

---

## Nguyên tắc chung (áp dụng mọi phase)

1. **Vị trí code**: mọi hook/API mới sống trong `client/src/features/admin/{api,hooks,components,types}` — **không** đặt trong `features/store`, `features/career`, `features/quest` dù data cùng domain, đúng tiền lệ đã có (`use-admin-quests.ts`, `use-admin-peer-interviews.ts` đã ở `admin/hooks`, không phải `quest/hooks`/`career/hooks`). Lý do: đây là dữ liệu/queryKey riêng cho mục đích quản trị (không filter `deletedAt`/`isActive`), khác hẳn hook công khai cùng feature.
2. **1 file API function** gộp chung vào `admin-api.ts` hiện có (không tách file riêng theo domain) — đúng cấu trúc hiện tại của file này.
3. **1 hook = 1 file**, đúng convention `use-create-contest.ts`/`use-update-contest.ts`/`use-delete-contest.ts` đã có — mutation hook nào cũng: gọi `adminApi.xxx`, `invalidateQueries` đúng queryKey list tương ứng, `toast.success`/`toast.error` (dùng `getApiErrorMessage`).
4. **Dialog form**: tái dùng `Dialog`/`Input`/`Label`/`Textarea`/`Button` từ shadcn (đã import sẵn khắp app) — copy khung `contest-form-dialog.tsx` (state `form`, `useEffect` reset khi `open`/entity đổi, `isPending` gộp từ create+update, disable Save khi field bắt buộc rỗng). Category/Difficulty/Company chọn qua `Select` (`@/components/ui/select`, đã có sẵn trong repo, chưa từng dùng ở admin form nào — sẽ là component `Select` đầu tiên trong `admin/components`). Trường boolean (`isActive`) dùng `Checkbox` (`@/components/ui/checkbox`).
5. **Confirm dialog** cho hành động phá huỷ/không hoàn tác được (Delete, Ban comment, Force-abandon) — tái dùng `ConfirmDialog` có sẵn (`admin/components/confirm-dialog.tsx`), không tạo dialog confirm riêng mỗi bảng.
6. **Badge/status**: giữ đúng công thức dot+text đã thiết lập (`bg-{color}-500`/`text-{color}-500`), bám theo `DIFFICULTY_DOT_CLASS`/`STATUS_DOT_CLASS` mẫu đã có ở `admin-quests-table.tsx`/`admin-contests-table.tsx` — không bịa màu mới.
7. **i18n**: mọi text mới thêm vào `client/src/lib/i18n/locales/{en,vi,ja}/admin.json`, đúng nhánh key đã có (`store.*`, `career.*`, `quests.*`, `discuss.*`, `peerInterview.*`) — thêm ở cả 3 locale trong cùng 1 commit, không để thiếu locale nào.
8. **Nút Actions**: cột cuối bảng, dùng lại label cột `t("problems.columnActions")` (đã được các bảng khác tái dùng chéo, đúng tiền lệ `admin-contests-table.tsx`/`admin-discuss-table.tsx`) — không tạo key `columnActions` riêng theo từng domain.
9. **QA bắt buộc**: sau khi code xong 1 phase, dùng Chrome tool test golden path (create → xuất hiện trong bảng → edit → cập nhật đúng → delete/ban/abandon → cập nhật trạng thái đúng) + edge case liên quan (field rỗng, trùng `key` → toast lỗi đọc từ 409 backend, xoá 1 entity đã xoá → nút bị disable sẵn nên không test được qua UI, nhưng phải xác nhận nút thực sự disable đúng lúc).

---

## Khảo sát trạng thái hiện tại từng bảng (trước khi sửa)

| Domain | Bảng hiện tại đọc từ | Vấn đề | Sau khi sửa đọc từ |
|---|---|---|---|
| Store | `useStoreItems()` (`features/store/hooks`, `GET /store/items` công khai) | Không thấy item đã xoá (`deletedAt` bị filter), không có cột Actions | `useAdminStoreItems()` mới (`admin/hooks`, `GET /admin/store/items`) |
| Career | `useCareerTracks()` (`features/career/hooks`, `GET /career/tracks` công khai) | Không thấy track `isActive=false`, không có cột Actions | `useAdminCareerTracks()` mới (`admin/hooks`, `GET /admin/career/tracks`) |
| Quest | `useAdminQuests()` (đã đúng, `GET /admin/quests`) | Có đủ data, chỉ thiếu cột Actions + dialog | Giữ nguyên hook đọc, chỉ thêm mutation |
| Discuss | `useDiscussPosts()` (đã đúng ở cấp bài viết) | Chưa có cách xem/ban **comment** trong 1 bài | Thêm dialog riêng gọi `GET /admin/discuss/:postId/comments` |
| Peer Interview | `useAdminPeerInterviews()` (đã đúng) | Có đủ data, chỉ thiếu nút force-abandon | Giữ nguyên hook đọc, chỉ thêm mutation |

---

## 🔴 P0 — Store: CRUD UI cho `ShopItem` — ✅ ĐÃ XONG

**Restore**: **không có** — `DELETE /store/items/:id` set `deletedAt`, không có endpoint nào set lại `null`. Item đã xoá coi như vĩnh viễn read-only ở UI (giống Contest).

- [x] `types/index.ts`: thêm `AdminShopItem`, `ShopItemFormPayload`, `ShopItemCategory` (khai báo riêng trong `admin/types`, không import chéo từ `features/store/types` — đúng ranh giới feature-folder).
  📍 `client/src/features/admin/types/index.ts`.
- [x] `admin-api.ts`: thêm `getStoreItems()`, `createShopItem(payload)`, `updateShopItem(id, payload)`, `deleteShopItem(id)`.
  📍 `client/src/features/admin/api/admin-api.ts`.
- [x] Hooks: `use-admin-store-items.ts` (queryKey `["admin-store-items"]`), `use-create-shop-item.ts`, `use-update-shop-item.ts`, `use-delete-shop-item.ts`.
  📍 `client/src/features/admin/hooks/`.
- [x] `shop-item-form-dialog.tsx`: field `key` (disable khi edit, hint "Không thể đổi key sau khi tạo"), `name`, `description`, `category` (Select), `price`, `iconKey` (hint đổi theo category).
  📍 `client/src/features/admin/components/shop-item-form-dialog.tsx`.
- [x] `admin-store-table.tsx`: đổi `useStoreItems()` (public) → `useAdminStoreItems()` (admin); thêm cột Status (dot đỏ/teal) + Actions (Edit/Delete, `disabled={!!item.deletedAt}`).
  📍 `client/src/features/admin/components/admin-store-table.tsx`.
- [x] `admin-store-page.tsx`: thêm nút "New Item", state `formOpen`/`editingItem`.
  📍 `client/src/features/admin/pages/admin-store-page.tsx`.
- [x] i18n (`store.*`, cả 3 locale: en/vi/ja) — đủ key `createNew/createTitle/editTitle/fieldKey/fieldName/fieldDescription/fieldCategory/fieldPrice/fieldIconKey/iconKeyHintTitle/iconKeyHintColor/keyLockedHint/columnStatus/statusActive/statusDeleted/deleteConfirmTitle/deleteConfirmDescription`.
- [x] **Verify**: `npx tsc -b` + `npm run lint` (client) sạch — chỉ 1 warning `react-hooks/set-state-in-effect` giống hệt pattern có sẵn ở `contest-form-dialog.tsx` (không phải lỗi mới). QA qua Chrome (đăng nhập `admin@algominds.dev`): tạo item mới → toast "Đã tạo vật phẩm", xuất hiện đúng trong bảng → edit `price` → toast "Đã cập nhật vật phẩm", giá trị đổi đúng → xoá → toast "Đã xoá vật phẩm", dot chuyển đỏ "Deleted", nút Edit/Delete disable → tạo lại với `key` trùng (đã xoá) → toast lỗi đúng "Mã vật phẩm (key) đã tồn tại" (409 từ backend). Không có lỗi console (chỉ warning React DialogDescription có sẵn từ trước, không phải regression). **Lưu ý**: không verify được responsive ~390px qua `resize_window` trong phiên này (giới hạn tool, screenshot không phản ánh đúng kích thước đã resize) — dialog dùng `max-w-lg` giống hệt `ContestFormDialog` đã ship nên rủi ro thấp, nhưng chưa xác nhận trực quan. Item test đã xoá thẳng khỏi DB sau khi verify (chưa có `UserItem` nào tham chiếu).

## 🟡 P1 — Career: CRUD UI cho `CareerTrack` — ✅ ĐÃ XONG

**Restore**: **có** — `PATCH /career/tracks/:id` nhận `isActive: true` để bật lại track đã tắt. Khác Store — Edit vẫn phải mở được kể cả khi track đang inactive.

- [x] `types/index.ts`: `AdminCareerTrack`, `CareerTrackFormPayload` (thêm cùng đợt với P0).
  📍 `client/src/features/admin/types/index.ts`.
- [x] `admin-api.ts`: `getCareerTracks()`, `createCareerTrack(payload)`, `updateCareerTrack(id, payload)`, `deleteCareerTrack(id)`.
  📍 `client/src/features/admin/api/admin-api.ts`.
- [x] Hooks: `use-admin-career-tracks.ts`, `use-create-career-track.ts`, `use-update-career-track.ts`, `use-delete-career-track.ts`.
  📍 `client/src/features/admin/hooks/`.
- [x] `career-track-form-dialog.tsx`: `key`, `name`, `description`, `companyId` (Select dùng `useCompanies()` có sẵn, option đầu "Chung"), `isActive` (Checkbox, chỉ hiện khi edit).
  📍 `client/src/features/admin/components/career-track-form-dialog.tsx`.
- [x] `admin-career-table.tsx`: đổi sang `useAdminCareerTracks()`; cột Actions (Edit luôn enable, Delete `disabled={!track.isActive}`).
  📍 `client/src/features/admin/components/admin-career-table.tsx`.
- [x] `admin-career-page.tsx`: nút "New Track" + state dialog.
  📍 `client/src/features/admin/pages/admin-career-page.tsx`.
- [x] i18n (`career.*`, 3 locale) đủ key.
- [x] **Verify**: `npx tsc -b` + `npm run lint` sạch (chỉ warning giống pattern có sẵn). QA qua Chrome: tạo track với company "Apple" (dropdown load đúng từ `useCompanies()`) → xuất hiện đúng tên công ty → xoá (soft) → toast "Đã tắt career track", status → "Inactive", nút Delete disable (click không mở dialog), **Edit vẫn mở được** → tick lại checkbox `isActive` → Save → status quay lại "Active" (restore hoạt động đúng). Không có lỗi console. Track test đã xoá thẳng khỏi DB sau khi verify (chưa có `CareerJourney` nào tham chiếu).

## 🟡 P2 — Quest: CRUD UI cho `BugSnippet`

**Restore**: **có**, cùng cơ chế Career (`PATCH .../isActive`). Áp dụng y hệt logic Edit-luôn-enable / Delete-disable-khi-đã-inactive ở P1.

- [ ] `types/index.ts`: thêm `BugSnippetFormPayload` (`language, difficulty, code, buggyLine, explanation?, isActive?`) — `AdminQuestSnippet` (đọc) đã có sẵn, không cần thêm.
  📍 `client/src/features/admin/types/index.ts`.
- [ ] `admin-api.ts`: thêm `createBugSnippet(payload)` (`POST /quest/snippets`), `updateBugSnippet(id, payload)` (`PATCH /quest/snippets/:id`), `deleteBugSnippet(id)` (`DELETE /quest/snippets/:id`). `getQuests()` đã có sẵn, giữ nguyên.
  📍 `client/src/features/admin/api/admin-api.ts`.
- [ ] Hooks: `use-create-bug-snippet.ts`, `use-update-bug-snippet.ts`, `use-delete-bug-snippet.ts` (invalidate `["admin-quests"]` — trùng queryKey `useAdminQuests()` đã có).
  📍 `client/src/features/admin/hooks/`.
- [ ] `bug-snippet-form-dialog.tsx`: `language` (Input free-text, backend không ràng buộc enum — dùng chung giá trị đã thấy trong bảng làm gợi ý placeholder, vd "javascript"), `difficulty` (Select EASY/MEDIUM/HARD, tái dùng `t("difficulty.easy"|"medium"|"hard")` đã có), `code` (Textarea `font-mono`, `min-h-[160px]`, đúng tinh thần hiện thị code), `buggyLine` (Input number, min 0 — **lưu ý UX**: hiển thị hint "số dòng bắt đầu từ 0" nếu backend 0-indexed, cần xác nhận lại convention lúc code bằng cách đọc `quest.service.ts#checkAnswer`), `explanation` (Textarea optional), `isActive` (Checkbox, chỉ hiện khi edit).
  📍 `client/src/features/admin/components/bug-snippet-form-dialog.tsx`.
- [ ] `admin-quests-table.tsx`: thêm cột **Actions** (Edit luôn enable, Delete `disabled={!quest.isActive}`).
  📍 `client/src/features/admin/components/admin-quests-table.tsx`.
- [ ] `admin-quests-page.tsx`: thêm nút "Tạo mới" + state dialog.
  📍 `client/src/features/admin/pages/admin-quests-page.tsx`.
- [ ] i18n (`quests.*`): `createNew`, `createTitle`, `editTitle`, `fieldLanguage`, `fieldDifficulty`, `fieldCode`, `fieldBuggyLine`, `fieldExplanation`, `deleteConfirmTitle`, `deleteConfirmDescription`.
- [ ] **Verify**: tsc/lint sạch. QA qua Chrome: tạo snippet mới (chọn đủ 3 mức difficulty lần lượt để test Select) → hiện đúng dot màu; edit `buggyLine`/`explanation`; xoá → dot chuyển "Ngừng hoạt động", Delete disable, Edit vẫn bấm được → bật lại `isActive` → dot chuyển lại "Hoạt động".

## 🟡 P3 — Discuss: UI ban comment

**Restore**: **không có** — `DELETE /discuss/:postId/comments/:commentId` chỉ set `deletedAt`, không có endpoint gỡ ban. 1 chiều, giống Store.

- [ ] `types/index.ts`: thêm `AdminDiscussComment` (`id, postId, content, createdAt, deletedAt: string | null, author: { id, name, avatarUrl: string | null }`).
  📍 `client/src/features/admin/types/index.ts`.
- [ ] `admin-api.ts`: thêm `getDiscussComments(postId)` (`GET /admin/discuss/:postId/comments`), `banDiscussComment(postId, commentId)` (`DELETE /discuss/:postId/comments/:commentId`).
  📍 `client/src/features/admin/api/admin-api.ts`.
- [ ] Hooks: `use-admin-discuss-comments.ts` (queryKey `["admin-discuss-comments", postId]`, `enabled: !!postId` — chỉ fetch khi dialog mở), `use-ban-discuss-comment.ts` (invalidate theo `postId` đang mở, **và** `["discuss-posts"]`/queryKey list bài viết hiện có — vì ban comment làm giảm `commentCount` hiển thị ở bảng ngoài, cần xác nhận đúng tên queryKey của `useDiscussPosts()` lúc code).
  📍 `client/src/features/admin/hooks/`.
- [ ] `discuss-comments-dialog.tsx`: Dialog lớn hơn (`max-w-2xl`), nhận `postId` (hoặc `null` = đóng). List comment: avatar+tên tác giả, nội dung (giữ nguyên xuống dòng, không truncate — khác cột `title` ngoài bảng), thời gian tạo, badge "Đã ẩn" (dot đỏ) nếu `deletedAt`, nút Ban (icon `Ban`/`ShieldOff` từ lucide, không phải `Trash2` — phân biệt hành động "ẩn comment" khác "xoá post") `disabled={!!comment.deletedAt}`. Empty state nếu bài chưa có comment nào.
  📍 `client/src/features/admin/components/discuss-comments-dialog.tsx`.
- [ ] `admin-discuss-table.tsx`: thêm nút icon (`MessageSquare`, cạnh nút `Trash2` xoá post hiện có) mở `DiscussCommentsDialog` với `postId` tương ứng; thêm state `viewingCommentsPostId`.
  📍 `client/src/features/admin/components/admin-discuss-table.tsx`.
- [ ] i18n (`discuss.*`): `viewComments` (tooltip/label nút), `commentsDialogTitle`, `columnAuthor`/`columnCreatedAt` (có sẵn, tái dùng), `commentContent` (nếu cần label), `noComments`, `banConfirmTitle`, `banConfirmDescription`, `bannedLabel`, `banAction`.
- [ ] **Verify**: tsc/lint sạch. QA qua Chrome: mở 1 bài có comment thật (cần tạo comment test qua UI người dùng thường trước, hoặc seed) → thấy đúng danh sách → ban 1 comment → badge "Đã ẩn" hiện ra, nút Ban disable → đóng dialog → cột "Comment" ở bảng ngoài giảm đúng 1 (xác nhận invalidate đúng cache post list).

## 🟢 P4 — Peer Interview: UI force-abandon

**Restore**: n/a — hành động đã là "chuyển về trạng thái cuối", không có khái niệm hoàn tác.

- [ ] `admin-api.ts`: thêm `forceAbandonPeerInterview(id)` (`PATCH /peer-interviews/:id/status`, body cố định `{ status: "ABANDONED" }`).
  📍 `client/src/features/admin/api/admin-api.ts`.
- [ ] Hook: `use-force-abandon-peer-interview.ts` (invalidate `["admin-peer-interviews"]`).
  📍 `client/src/features/admin/hooks/`.
- [ ] `admin-peer-interview-table.tsx`: thêm cột **Actions** — 1 nút icon (`OctagonX` hoặc tương tự từ lucide) mở `ConfirmDialog`, `disabled` khi `status` là `COMPLETED` hoặc `ABANDONED` (khớp đúng điều kiện chặn 400 ở `peer-interview.service.ts#forceAbandon()`, tránh gọi API chắc chắn lỗi).
  📍 `client/src/features/admin/components/admin-peer-interview-table.tsx`.
- [ ] i18n (`peerInterview.*`): `forceAbandonAction` (tooltip nút), `forceAbandonConfirmTitle`, `forceAbandonConfirmDescription`.
- [ ] **Verify**: tsc/lint sạch. QA qua Chrome: cần 1 session ở trạng thái `WAITING_FOR_PEER`/`ACTIVE` thật để test (tạo qua flow invite-code bằng 2 tài khoản test, hoặc chấp nhận chỉ verify bằng ảnh chụp nút disable đúng nếu không có session sống) → bấm nút → confirm → status chuyển "Đã huỷ", nút tự disable sau khi cập nhật.

---

## File cần đụng khi thực thi (tổng hợp, không phải lượt này)
- `client/src/features/admin/types/index.ts` — thêm `AdminShopItem`, `ShopItemFormPayload`, `AdminCareerTrack`, `CareerTrackFormPayload`, `BugSnippetFormPayload`, `AdminDiscussComment`.
- `client/src/features/admin/api/admin-api.ts` — thêm 11 hàm (`getStoreItems`, `createShopItem`, `updateShopItem`, `deleteShopItem`, `getCareerTracks`, `createCareerTrack`, `updateCareerTrack`, `deleteCareerTrack`, `createBugSnippet`, `updateBugSnippet`, `deleteBugSnippet`, `getDiscussComments`, `banDiscussComment`, `forceAbandonPeerInterview` — 14 thực ra, đếm lại lúc code).
- `client/src/features/admin/hooks/` — 13 file hook mới (3 store + 3 career + 3 quest + 2 discuss + 1 peer-interview, cộng 1 list hook mới cho store/career).
- `client/src/features/admin/components/` — 4 dialog mới (`shop-item-form-dialog.tsx`, `career-track-form-dialog.tsx`, `bug-snippet-form-dialog.tsx`, `discuss-comments-dialog.tsx`) + sửa 5 table hiện có.
- `client/src/features/admin/pages/` — sửa `admin-store-page.tsx`, `admin-career-page.tsx`, `admin-quests-page.tsx` (thêm nút Create + state dialog); `admin-discuss-page.tsx`/`admin-peer-interview-page.tsx` không cần sửa (logic dialog nằm trong table).
- `client/src/lib/i18n/locales/{en,vi,ja}/admin.json` — thêm key cho cả 5 domain, 3 locale.
- **Không đụng**: `features/store`, `features/career`, `features/quest`, `features/discuss` (hook/type công khai giữ nguyên, chỉ admin đọc qua endpoint riêng); backend (đã xong, ngoài phạm vi lần này).

## Việc cần làm ngay lượt này
Chỉ ghi kế hoạch trên vào `ROADMAP.md` — **không viết code**. Sau khi user review xong, chỉ thực thi khi được yêu cầu rõ (vd "làm P0", "tiếp tục", "thực hiện roadmap").

## Verification (áp dụng khi thực thi, không phải lượt này)
- `npx tsc -b` (client, qua `npm run build` hoặc chạy `tsc -b` trực tiếp) + `npm run lint` (client) sạch sau mỗi phase.
- QA qua Chrome tool bắt buộc theo `design.md` — golden path + edge case + responsive ~390px cho dialog mới.
- 1 task (checkbox) = 1 commit, tick `- [ ]` → `- [x]` ngay khi xong kèm ghi chú nếu phát hiện lệch so với kế hoạch (vd buggyLine 0-indexed hay 1-indexed, tên queryKey thực tế của `useDiscussPosts()`).
- Không tự ý `git push`/mở PR nếu chưa được yêu cầu rõ.
- Thứ tự P0→P4 không bắt buộc tuần tự cứng — 5 domain độc lập nhau hoàn toàn (khác Store P0 ở bản backend từng là điều kiện tiên quyết vì cần migration) — có thể làm theo thứ tự user chỉ định.
