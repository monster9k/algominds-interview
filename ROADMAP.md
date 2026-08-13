# 🗺️ AlgoMinds — Roadmap: Admin CRUD endpoints (Store/Career/Quest/Peer Interview) + Discuss comment moderation

> Bản roadmap trước ("Compact premium SaaS density cho Admin Dashboard + Admin Problems") đã hoàn thành P0/P1/P2 ở commit `51d0ea1`. Ngoài ra, cùng phiên làm việc đó còn có 1 đợt mở rộng UI chưa được tổng hợp lại thành mục riêng trong roadmap cũ trước khi bị thay thế: thêm "surface" (panel nền `bg-muted/40` bao ngoài) cho toàn bộ 8 trang bảng admin còn lại (Contests, Users, Store, Discuss, Career, Quests, Peer Interview, Audit Log) + Dashboard, đổi Difficulty/Status/Action-badge sang dạng dot+text gọn hơn, refine nút Actions — code đã xong, đã QA qua Chrome, **nhưng chưa commit**, đang chờ user duyệt lần cuối. Xem lại nội dung roadmap cũ ở commit `51d0ea1` nếu cần tham chiếu.
>
> Bản này **thay thế hoàn toàn** — chủ đề khác hẳn (backend, không phải redesign UI). Mục tiêu: lên kế hoạch cho các endpoint backend còn thiếu để bảng admin Store/Career/Quests/Peer Interview có đủ chức năng **thêm/sửa/xoá** (hiện tại 4 bảng này chỉ có GET, hoàn toàn read-only), và riêng **Discuss** cần thêm khả năng **"ban" 1 comment cụ thể** (khác với xoá cả bài viết — endpoint xoá post đã có sẵn).
>
> **Trạng thái: 🔴 P0 (Store), 🟡 P1 (Career), 🟡 P2 (Quest) đã xong** — CRUD `ShopItem`/`CareerTrack`/`BugSnippet` đầy đủ, verify build/lint/test + tay qua curl, mỗi phase 1 commit riêng. Tiếp theo: 🟡 P3 (Discuss ban comment).

## Cách đọc file này
- Mỗi mục ghi rõ **model Prisma liên quan**, **rủi ro FK/data-integrity** (nếu có), và **vị trí code** (`📍`) cần đụng khi thực thi.
- `🔴 P0` — rủi ro cao nhất, cần migration schema trước khi làm được (Store).
- `🟡 P1`/`🟡 P2`/`🟡 P3` — không cần migration, dùng field đã có sẵn trong schema.
- `🟢 P4` — **cần hỏi lại user xác nhận phạm vi** trước khi triển khai (Peer Interview là bản ghi runtime, không phải "nội dung" — "thêm" không hợp lý về sản phẩm).

---

## Nguyên tắc kiến trúc chung (áp dụng cho mọi phase)

1. **Vị trí code mutation**: sống trong controller/service CỦA ĐÚNG MODULE (`store.controller.ts`, `career.controller.ts`, `quest.controller.ts`, `discuss.controller.ts`) — **không** tập trung vào `admin.controller.ts`, đúng convention đã có sẵn ở `contest.controller.ts`/`problems.controller.ts` (`POST`/`PATCH`/`DELETE` admin-gated ngay trong controller gốc; `admin.controller.ts` chỉ giữ list/stats + vài action đặc thù như `updateUserRole`).
2. **Guard**: mọi endpoint mutation mới đều `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')` (riêng Discuss comment-ban giữ đúng quyền hiện có của xoá post: `@Roles('ADMIN', 'MODERATOR')`).
3. **Audit log**: mọi mutation phải gọi `AdminAuditService.log(userId, ACTION, targetType, targetId, metadata?)` — đúng pattern `admin.controller.ts`/`discuss.controller.ts` hiện có.
4. **DTO**: `class-validator`, tách `CreateXxxDto` (field bắt buộc) + `UpdateXxxDto` (mọi field optional) — đúng convention `create-contest.dto.ts`/`update-contest.dto.ts`.
5. **"Xoá" ưu tiên soft-delete** dùng field đã có sẵn trong schema (`isActive`/`deletedAt`) thay vì hard-delete — trừ Store (chưa có field phù hợp, cần migration, xem P0).
6. **Phạm vi lần này CHỈ BACKEND** — hook (`use-create-*`/`use-update-*`/`use-delete-*`, đúng convention `client/src/features/admin/hooks/use-create-contest.ts` đã có) + dialog form phía frontend là 1 phase riêng, làm sau khi backend xong và được yêu cầu rõ.

---

## Khảo sát rủi ro theo từng entity

### Store (`ShopItem`)
- Model: `id, key(unique), name, description, category(enum), price, iconKey, createdAt` — **không có** `deletedAt`/`isActive`.
- ⚠️ **Rủi ro cao**: `UserItem.item` khai `onDelete: Cascade` — hard-delete 1 `ShopItem` sẽ **xoá luôn mọi `UserItem` đang sở hữu nó** (user mất vật phẩm đã mua, kể cả đang equipped). **Tuyệt đối không hard-delete.**
- → Cần migration thêm `deletedAt DateTime?`, lọc `deletedAt: null` ở `GET /store/items` (catalog công khai) — DELETE admin = soft delete.

### Career (`CareerTrack`)
- Model: `id, key(unique), name, description, isActive, companyId?, createdAt`.
- `CareerJourney.track` không khai `onDelete` → Prisma dùng default DB (Restrict) — hard-delete sẽ **lỗi FK constraint** ngay khi có ≥1 journey tham chiếu track đó.
- → Không cần migration — tái dùng field `isActive` sẵn có (đúng cột STATUS đang hiển thị trên bảng admin) làm cờ soft-delete.

### Quest (`BugSnippet`)
- Model: `id, language, difficulty, code, buggyLine, explanation, isActive, createdAt`.
- Comment sẵn trong schema xác nhận chủ đích thiết kế: *"để tắt câu hỏi lỗi mà không xoá (giữ lịch sử QuestAttempt tham chiếu được)"* — `isActive` đã được thiết kế đúng cho mục đích "xoá mềm" này.
- → Không cần migration — DELETE admin = set `isActive=false`.

### Peer Interview (`PeerInterviewSession`)
- Model: bản ghi **phiên runtime** (candidate/interviewer/problem/status/inviteCode/timestamps) do **user** tạo qua flow ghép cặp bằng invite-code — khác bản chất với 3 mục trên (không phải "nội dung" admin biên tập).
- Không có `isActive`/`deletedAt`.
- ⚠️ "Thêm" (create) không hợp lý sản phẩm — phiên phải qua đúng luồng invite-code. Xoá thật sẽ cascade xoá `PeerInterviewMessage`/`PeerInterviewEvaluation`/`JourneyStageProgress` liên kết (mất lịch sử chat + kết quả chấm).
- → Đề xuất thu hẹp: chỉ làm **"Sửa"** (force-update status về `ABANDONED` để giải phóng phiên bị kẹt) — xem P4, **cần bạn xác nhận lại phạm vi** trước khi triển khai.

### Discuss — ban comment (`DiscussComment`)
- Model **đã có sẵn** `deletedAt DateTime?` (`discuss.service.ts` đã filter `where: { deletedAt: null }` khi trả comment) — **không cần migration**.
- Hiện **không có** endpoint xoá/ẩn 1 comment cụ thể (chỉ có `DELETE /discuss/:id` xoá cả bài viết).
- → Thêm endpoint mới, set `deletedAt` trên đúng 1 `DiscussComment`, đồng thời giảm `DiscussPost.commentCount` (transaction, đối xứng với `createComment` tăng đếm).

---

## Kế hoạch endpoint theo thứ tự ưu tiên

### 🔴 P0 — Store: CRUD `ShopItem` (cần migration trước) — ✅ ĐÃ XONG
- [x] Migration: thêm `deletedAt DateTime?` vào `ShopItem`; cập nhật `GET /store/items` lọc `deletedAt: null`.
  📍 `server/prisma/schema.prisma`, `server/src/modules/store/store.service.ts#getItems()`.
  ⚠️ Phát hiện **migration history bị drift từ trước** (migration `20260805230541_add_journey_readiness_report` đã bị sửa sau khi apply — không liên quan thay đổi lần này). `prisma migrate dev` đòi reset toàn bộ DB (mất dữ liệu) — **đã KHÔNG làm theo**, dùng `npx prisma db push` thay thế (lệnh hợp lệ theo CLAUDE.md), chỉ ALTER TABLE thêm cột, verify qua psql xác nhận 8 shop_items + toàn bộ bảng khác còn nguyên. Migration history vẫn còn drift — cần dọn lại nếu sau này muốn dùng `migrate dev` bình thường (ngoài phạm vi P0).
- [x] `dto/create-shop-item.dto.ts`: `key, name, description, category(enum), price(int ≥0), iconKey` — bắt buộc.
- [x] `dto/update-shop-item.dto.ts`: mọi field optional.
- [x] `POST /store/items` (ADMIN) — check `key` unique, 409 nếu trùng.
- [x] `PATCH /store/items/:id` (ADMIN) — 404 nếu không tồn tại/đã xoá.
- [x] `DELETE /store/items/:id` (ADMIN) — set `deletedAt`.
  📍 `server/src/modules/store/store.controller.ts`, `store.service.ts`, `store.module.ts` (import `AdminModule` để inject `AdminAuditService`, đúng pattern `discuss.module.ts`).
- [x] Audit log: `CREATE_SHOP_ITEM` / `UPDATE_SHOP_ITEM` / `DELETE_SHOP_ITEM`.
  📍 `server/src/modules/admin/admin-audit.service.ts` (mở rộng `AdminAction`/`AdminActionTargetType`).
- [x] Thêm query admin riêng (không filter `deletedAt`) để bảng `/admin/store` hiển thị đúng cả item đã xoá — đúng pattern `admin.service.ts#getProblems()`.
  📍 `GET /admin/store/items` — `admin.service.ts#getStoreItems()` + route trong `admin.controller.ts`.
- [x] **Verify**: `npm run build` + `npm run lint` (server) sạch. `npm run test` — 61/61 test pass (kể cả `store.service.spec.ts` có sẵn, không bị phá bởi filter `deletedAt` mới thêm). Test tay end-to-end qua curl với JWT admin thật: create → 409 khi trùng key → update → `GET /admin/store/items` thấy item mới → create không token → 401 → delete → catalog công khai không còn hiện item đã xoá → `GET /admin/store/items` vẫn thấy item (kèm `deletedAt`) → audit log ghi đủ `CREATE_SHOP_ITEM`/`UPDATE_SHOP_ITEM`/`DELETE_SHOP_ITEM` theo đúng thứ tự. Item test đã dọn khỏi DB sau khi verify xong (chưa từng được mua, hard-delete trực tiếp an toàn).

### 🟡 P1 — Career: CRUD `CareerTrack` (không cần migration) — ✅ ĐÃ XONG
- [x] `dto/create-career-track.dto.ts`: `key, name, description, companyId?` — `isActive` mặc định `true` (Prisma `@default(true)`, DTO không cần field này).
- [x] `dto/update-career-track.dto.ts`: mọi field optional, gồm cả `isActive` (cho phép bật lại track đã tắt).
- [x] `POST /career/tracks`, `PATCH /career/tracks/:id`, `DELETE /career/tracks/:id` (set `isActive=false`, KHÔNG hard-delete) — (ADMIN, `@UseGuards(RolesGuard) @Roles('ADMIN')` áp riêng lên 3 route mới, class-level chỉ có `JwtAuthGuard` vì mọi route công khai khác trong `career.controller.ts` không cần role check).
  📍 `server/src/modules/career/career.controller.ts`, `career.service.ts`.
- [x] Audit log: `CREATE_CAREER_TRACK` / `UPDATE_CAREER_TRACK` / `DELETE_CAREER_TRACK`.
  📍 `server/src/modules/admin/admin-audit.service.ts` (mở rộng `AdminAction`/`AdminActionTargetType` thêm `CareerTrack`), `CareerModule` import `AdminModule` để inject `AdminAuditService` (đúng pattern StoreModule/QuestModule ở P0/P2, không tạo cycle vì `AdminModule` không import gì ngược lại).
- [x] `getActiveTracks()` hiện tại filter `isActive: true` (đúng cho phía user) — đã thêm `admin.service.ts#getCareerTracks()` + `GET /admin/career/tracks` trả TẤT CẢ track (kể cả inactive, kèm `company`) — endpoint mới, frontend admin table hiện tại (`use-career-tracks.ts`) vẫn đang gọi `GET /career/tracks` công khai (bị filter `isActive`) nên **chưa** thấy track inactive; nối dây frontend sang endpoint admin mới là việc của phase hook/dialog riêng (ngoài phạm vi backend-only lần này).
- ⚠️ Form Create/Edit chỉ gồm 4 field cơ bản (`key/name/description/companyId`) — **không** động vào `CareerTrackStage` (cấu trúc pipeline nhiều bước, ngoài phạm vi CRUD đơn giản này; track mới tạo sẽ chưa có stage nào cho tới khi có tính năng quản lý stage riêng).
- [x] **Verify**: `npm run build` + `npm run lint` (server) sạch. `npm run test` — 61/61 pass. Test tay end-to-end qua curl với JWT admin thật: create không token → 401 → create → 201 → trùng key → 409 → xuất hiện ở `GET /career/tracks` công khai (isActive=true) → update description → `GET /admin/career/tracks` phản ánh đúng → soft-delete → biến mất khỏi `GET /career/tracks` công khai nhưng vẫn thấy ở `GET /admin/career/tracks` (kèm `isActive:false`) → delete lần 2 → 404 → update id không tồn tại → 404 → audit log ghi đủ 3 hành động đúng thứ tự. Track test đã xoá thẳng khỏi DB sau khi verify (chưa có `CareerJourney` nào tham chiếu vì vừa tạo, hard-delete trực tiếp an toàn).

### 🟡 P2 — Quest: CRUD `BugSnippet` (không cần migration) — ✅ ĐÃ XONG
- [x] `dto/create-bug-snippet.dto.ts`: `language, difficulty(enum), code, buggyLine(int)`, `explanation?` — `isActive` mặc định `true` (do Prisma `@default(true)`, DTO không cần field này).
- [x] `dto/update-bug-snippet.dto.ts`: mọi field optional + `isActive`.
- [x] `POST /quest/snippets`, `PATCH /quest/snippets/:id`, `DELETE /quest/snippets/:id` (set `isActive=false`) — (ADMIN, `@UseGuards(RolesGuard) @Roles('ADMIN')` áp riêng lên 3 route mới, class-level chỉ có `JwtAuthGuard` vì các route công khai khác trong cùng controller không cần role check).
  📍 `server/src/modules/quest/quest.controller.ts`, `quest.service.ts`.
- [x] Audit log: `CREATE_BUG_SNIPPET` / `UPDATE_BUG_SNIPPET` / `DELETE_BUG_SNIPPET`.
  📍 `server/src/modules/admin/admin-audit.service.ts` (mở rộng `AdminAction`/`AdminActionTargetType` thêm `BugSnippet`), `QuestModule` import `AdminModule` để inject `AdminAuditService` (đúng pattern `StoreModule` ở P0).
- [x] `admin.service.ts#getQuests()` đã trả đủ field (không strip `buggyLine` như `GET /quest/snippets` công khai) — giữ nguyên, dùng luôn cho list admin sau CRUD, không cần sửa gì thêm.
- [x] **Verify**: `npm run build` + `npm run lint` (server) sạch. `npm run test` — 61/61 pass (không có test riêng cho quest, nhưng không phá vỡ 5 suite hiện có). Test tay end-to-end qua curl với JWT admin thật: create → xuất hiện trong `GET /quest/snippets` công khai → update explanation → `GET /admin/quests` phản ánh đúng → soft-delete → `GET /admin/quests` vẫn thấy (kèm `isActive:false`) → `GET /quest/snippets` công khai không còn hiện (verify bằng cách quét `count=30` cùng `language`) → delete lần 2 → 404 → update id không tồn tại → 404 → tạo không token → 401 → audit log ghi đủ 3 hành động đúng thứ tự. Snippet test đã xoá thẳng khỏi DB sau khi verify (chưa từng có `QuestAttempt` nào tham chiếu vì bảng này không có FK tới `BugSnippet`).

### 🟡 P3 — Discuss: ban 1 comment cụ thể (không cần migration)
- [ ] `DELETE /discuss/:postId/comments/:commentId` (ADMIN + MODERATOR — cùng quyền với xoá post hiện có) — set `DiscussComment.deletedAt`, đồng thời `DiscussPost.commentCount` decrement trong 1 transaction (đối xứng `createComment`).
  📍 `server/src/modules/discuss/discuss.controller.ts`, `discuss.service.ts`.
- [ ] Audit log: `BAN_DISCUSS_COMMENT` (đặt tên "BAN" khớp ngôn ngữ sản phẩm, bản chất kỹ thuật vẫn là soft-delete).
- [ ] Cần thêm endpoint đọc để admin thấy list comment theo post (hiện `admin.service.ts` không có gì ở cấp comment) — đề xuất `GET /admin/discuss/:postId/comments` (trả cả comment đã bị ban để phân biệt trạng thái). Quyết định UI (trang riêng vs. mở rộng trong bảng Discuss hiện có) thuộc phase frontend sau — backend chỉ cần đảm bảo endpoint đọc tồn tại.

### 🟢 P4 — (Cần xác nhận phạm vi trước khi làm) Peer Interview: force-update status
- [ ] `PATCH /peer-interviews/:id/status` (ADMIN) — body `{ status: 'ABANDONED' }`, **chỉ** cho set về `ABANDONED` (không cho set `WAITING_FOR_PEER`/`ACTIVE`/`COMPLETED` thủ công — tránh phá logic tự chấm ở `career.service.ts#handlePeerInterviewGraded()`).
  📍 `server/src/modules/peer-interview/peer-interview.controller.ts`, `peer-interview.service.ts`.
- [ ] Audit log: `FORCE_ABANDON_PEER_INTERVIEW`.
- [ ] **Không** làm Create (không hợp lý sản phẩm). **Không** làm Delete thật (cascade xoá message/evaluation/journey-progress) trừ khi bạn xác nhận muốn đánh đổi mất lịch sử — nếu chỉ cần "ẩn khỏi danh sách admin mà vẫn giữ dữ liệu", cần thêm cột riêng (ngoài phạm vi P4, hỏi lại nếu cần).

---

## File cần đụng khi thực thi (không phải lượt này)
- Migration: `server/prisma/schema.prisma` (`ShopItem.deletedAt`) + `npx prisma migrate dev`.
- DTO mới: `server/src/modules/store/dto/{create,update}-shop-item.dto.ts`, `server/src/modules/career/dto/{create,update}-career-track.dto.ts`, `server/src/modules/quest/dto/{create,update}-bug-snippet.dto.ts`.
- Controller: `store.controller.ts`, `career.controller.ts`, `quest.controller.ts`, `discuss.controller.ts`, (P4) `peer-interview.controller.ts` — thêm route mutation admin-gated.
- Service: `store.service.ts`, `career.service.ts`, `quest.service.ts`, `discuss.service.ts`, (P4) `peer-interview.service.ts` — thêm method CRUD + gọi `AdminAuditService`.
- `admin.service.ts`: thêm/đổi hàm list để KHÔNG filter `deletedAt`/`isActive` cho admin (Store/Career) — giữ nguyên `getQuests()`/`getPeerInterviews()` sẵn có.
- **Không đụng**: `CareerTrackStage`/pipeline nhiều bước, luồng tạo `PeerInterviewSession` qua invite-code hiện có, `problems`/`contest` module (đã có CRUD đầy đủ, ngoài phạm vi).

## Việc cần làm ngay lượt này
Chỉ ghi kế hoạch trên vào `ROADMAP.md` — **không viết code, không chạy migration** ở lượt này, đúng yêu cầu "lên kế hoạch".

## Verification (áp dụng khi thực thi, không phải lượt này)
- `npx prisma migrate dev` sau khi sửa schema (P0), verify local DB không lỗi.
- `npm run test` (server) — pattern theo `auth.service.spec.ts`/`judge.service.spec.ts`; cân nhắc thêm test cho logic soft-delete có điều kiện FK (Career/Quest) vì đây là module chưa có test coverage.
- Test tay qua Postman/curl endpoint mới trước khi làm phase frontend (chưa có UI để test qua trình duyệt ở giai đoạn này).
- 1 task = 1 commit, tick `- [ ]` → `- [x]` ngay khi xong, không tự push/mở PR.
- P0 (Store) phải xong migration + verify trước khi đụng tới P1 trở đi (không bắt buộc tuần tự cứng nhắc như checkpoint P0 ở roadmap redesign trước, nhưng thứ tự ưu tiên phản ánh đúng mức độ rủi ro).
