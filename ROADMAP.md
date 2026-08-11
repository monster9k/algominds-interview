# 🗺️ AlgoMinds — Roadmap: Thảo luận (Discuss) — forum kiểu LeetCode

> Bản roadmap trước (Store: xu & vật phẩm cosmetic) đã hoàn thành 100% ở P0/P1 và merge vào `main` — xem lịch sử git (commit cuối chỉnh sửa: `1d190a3`) nếu cần tham chiếu lại nội dung cũ. P2 của bản đó (item ảnh thật, streak bonus, leaderboard giàu nhất, Admin UI catalog) vẫn còn treo nhưng nằm ngoài scope hiện tại — không đụng tới trong roadmap này.
> Bản này thay thế nó. Tính năng hoàn toàn mới, chưa có gì tồn tại (đã grep xác nhận: không có model `Post`/`Comment`/`Vote`/`Discuss` nào trong `schema.prisma`, không có module backend, không có feature folder frontend). Nav header đã có sẵn label `nav.discuss` ("Thảo luận") nhưng `href: "#"` — placeholder chết giống hệt kiểu `nav.store`/`nav.contest` từng bị trước khi được xây (`client/src/components/layout/dashboard-header.tsx:15`).
>
> Yêu cầu sản phẩm:
> 1. **UI trang `/discuss`**: theo đúng mockup user gửi — header "Thảo luận" + nút Lọc/Mới nhất + nút "TẠO BÀI VIẾT MỚI" nổi bật; list bài viết dạng card (avatar, tên, thời gian, tiêu đề, excerpt, tag pill, view/comment/upvote count); sidebar phải: "Chủ đề Nổi Bật" (tag cloud), "Đóng Góp Nổi Bật" (leaderboard), "Quy định cộng đồng". **Giữ nguyên theme màu** — mockup vốn đã dùng đúng tông màu nền tối + accent đỏ/hồng của app hiện tại, chỉ map đúng token màu sẵn có (`primary`, `emerald-500`, `muted`...), không bịa màu mới.
> 2. **Không chỉ 1 trang riêng** — mỗi bài toán (problem) trong lúc làm bài phải có tab "Thảo luận" riêng, đúng kiểu tab Discuss của LeetCode thật, lọc theo đúng problem đó.

## Cách đọc file này
- `🔴 P0` — Lõi bắt buộc: schema DB (post/comment/vote/tag), module backend `discuss`, seed data, FE route + nav + trang `/discuss` cơ bản (list + tạo bài + vote), tab "Thảo luận" gắn trong problem panel.
- `🟡 P1` — Hoàn thiện: sidebar widget nối API thật (trending tags/top contributors), view count, i18n đầy đủ 3 ngôn ngữ, test suite (`discuss`).
- `🟢 P2` — Mở rộng (ngoài scope hiện tại, ghi lại để làm sau): reply lồng nhau + vote comment, report/flag + duyệt admin, sửa/xoá bài, markdown editor có preview, thông báo real-time, dedupe view count.
- Mỗi task ghi **vị trí code** liên quan để bắt tay vào làm ngay.
- **Lưu ý thứ tự bắt buộc**: task DB schema (P0, mục đầu tiên) phải xong trước mọi task BE khác. Task "tab Discuss trong problem panel" phụ thuộc feature folder `discuss` (hooks/components) đã có từ task FE ngay trước đó trong P0 — làm sau cùng trong P0.

---

## Khảo sát kỹ thuật quan trọng (ảnh hưởng thiết kế)

- **Quy ước Prisma**: `id String @id @default(uuid())`, `@@map snake_case`, many-to-many qua bảng trung gian kiểu `ProblemTag` (`problemId`/`tagId`, `@@id([...])`) — tái dùng y hệt cho tag bài viết. Chưa có tiền lệ vote/upvote nào trong schema — đây sẽ là tính năng đầu tiên, dùng pattern đếm denormalize (`upvoteCount Int @default(0)` như `Problem.submitCount`) + bảng join `@@unique([userId, postId])` kiểu `UserItem` để chống vote 2 lần (dùng 2 bảng vote riêng cho post/comment thay vì 1 bảng union — tránh bẫy NULL không unique của Postgres khi 1 cột FK nullable).
- **`Tag` model có sẵn** (`schema.prisma:189`) dùng cho Problem — tái sử dụng nguyên model này cho tag bài thảo luận qua bảng trung gian mới `DiscussPostTag`, không tạo model tag riêng.
- **Guard pattern**: `OptionalJwtAuthGuard` (`server/src/modules/auth/optional-jwt-auth.guard.ts`) cho các API đọc (khách vãng lai cũng xem được list/detail — đúng kiểu LeetCode Discuss công khai), `JwtAuthGuard` cho API ghi (tạo bài/comment/vote). **Quan trọng**: `DashboardLayout` không tự chặn route theo auth — chỉ có axios interceptor tự redirect `/auth/login` khi API trả 401 (`client/src/lib/axios.ts:97`), nên nếu lỡ gắn `JwtAuthGuard` vào endpoint GET list, khách chưa đăng nhập vào `/discuss` sẽ bị văng thẳng ra trang login — **bắt buộc dùng `OptionalJwtAuthGuard` cho mọi GET**.
- **Leaderboard/groupBy pattern** đã có sẵn ở `quest.service.ts:275-307` (`prisma.questAttempt.groupBy` + `orderBy: { _max: { score: 'desc' } }` + enrich N+1) — tái dùng y hệt cho "Đóng góp nổi bật" (groupBy theo `authorId`, sắp theo tổng upvote nhận được) và "Chủ đề nổi bật" (groupBy theo `tagId` trên `DiscussPostTag`, sắp theo số bài).
- **Tab bài toán**: `client/src/features/interview/components/problem-panel.tsx` đã có sẵn 2 tab "coming soon" (`editorial`, `solutions`) làm khuôn mẫu y hệt cho việc thêm tab `discuss` mới. `Problem` type dùng ở trang này (`problem-panel/types.ts`) **không có field `id`** — phải lấy problem id qua prop mới `problemId` (nguồn: `session.problemId` đã có sẵn trong `interview-room.tsx`), không sửa `Problem` type.
- **Thiếu 1 shadcn primitive**: `client/src/components/ui/textarea.tsx` chưa tồn tại — cần thêm (theo đúng style các file `ui/*.tsx` khác) để làm ô nhập nội dung bài viết/comment.

---

## 🔴 P0 — Schema, module `discuss` backend, trang `/discuss` cơ bản, tab Discuss trong problem

- [x] **DB: schema bài viết/comment/vote/tag**
  📍 `server/prisma/schema.prisma`
  ```prisma
  model DiscussPost {
    id           String    @id @default(uuid())
    authorId     String
    problemId    String?   // null = thảo luận chung, có giá trị = gắn 1 bài toán cụ thể
    title        String
    content      String    // markdown thô, render ở FE
    viewCount    Int       @default(0)
    upvoteCount  Int       @default(0)
    commentCount Int       @default(0)
    createdAt    DateTime  @default(now())
    updatedAt    DateTime  @updatedAt
    deletedAt    DateTime?

    author   User             @relation(fields: [authorId], references: [id], onDelete: Cascade)
    problem  Problem?         @relation(fields: [problemId], references: [id], onDelete: SetNull)
    tags     DiscussPostTag[]
    comments DiscussComment[]
    votes    DiscussPostVote[]

    @@map("discuss_posts")
  }

  model DiscussComment {
    id        String    @id @default(uuid())
    postId    String
    authorId  String
    content   String
    createdAt DateTime  @default(now())
    deletedAt DateTime?

    post   DiscussPost @relation(fields: [postId], references: [id], onDelete: Cascade)
    author User        @relation(fields: [authorId], references: [id], onDelete: Cascade)

    @@map("discuss_comments")
  }

  model DiscussPostVote {
    id        String   @id @default(uuid())
    userId    String
    postId    String
    createdAt DateTime @default(now())

    user User        @relation(fields: [userId], references: [id], onDelete: Cascade)
    post DiscussPost @relation(fields: [postId], references: [id], onDelete: Cascade)

    @@unique([userId, postId])
    @@map("discuss_post_votes")
  }

  model DiscussPostTag {
    postId String
    tagId  String

    post DiscussPost @relation(fields: [postId], references: [id], onDelete: Cascade)
    tag  Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)

    @@id([postId, tagId])
    @@map("discuss_post_tags")
  }
  ```
  Thêm quan hệ ngược: `Tag.discussPosts DiscussPostTag[]`, `Problem.discussPosts DiscussPost[]`, `User.discussPosts/discussComments/discussPostVotes`.
  P0 **cố tình chưa làm reply lồng nhau / vote comment** (giữ comment phẳng, không vote) — để P2, đúng tinh thần "core trước, polish sau" đã áp dụng ở roadmap Store.
  Áp dụng bằng `npx prisma db push` (theo đúng tiền lệ prototype các model mới gần đây), sau đó `npx prisma generate`.

- [x] **FE: thêm `Textarea` primitive còn thiếu**
  📍 `client/src/components/ui/textarea.tsx` — theo đúng style các file `ui/*.tsx` khác (`input.tsx` làm mẫu), cần cho ô nhập nội dung bài viết/comment.

- [x] **BE: module `discuss` mới**
  📍 `server/src/modules/discuss/` (`discuss.module.ts`, `discuss.controller.ts`, `discuss.service.ts`, `dto/`), tham khảo `store` module (routing đơn giản) + `quest.service.ts` (groupBy leaderboard) + `problems.service.ts` (`findAll` với filter động qua `Prisma.XWhereInput`).
  ```
  GET  /discuss                    OptionalJwtAuthGuard   → list bài viết, query: problemId?, tag?, sort? (newest|mostViewed|mostUpvoted), search?
  GET  /discuss/:id                OptionalJwtAuthGuard   → chi tiết bài + comments, tăng viewCount (throttle theo session/IP đơn giản hoặc bỏ qua nếu phức tạp — ghi rõ giới hạn trong code comment)
  POST /discuss                    JwtAuthGuard           → tạo bài (title, content, tagIds[], problemId?)
  POST /discuss/:id/comments       JwtAuthGuard           → tạo comment
  POST /discuss/:id/vote           JwtAuthGuard           → toggle upvote (tạo/xoá row `DiscussPostVote`, `$transaction` cập nhật `upvoteCount`)
  GET  /discuss/tags/trending      OptionalJwtAuthGuard   → top tag theo số bài (groupBy DiscussPostTag)
  GET  /discuss/contributors/top   OptionalJwtAuthGuard   → top user theo tổng upvote nhận được (groupBy DiscussPost.authorId, sum upvoteCount)
  ```
  `createComment`: `$transaction` tăng `commentCount` trên post. `toggleVote`: `$transaction` tìm/tạo/xoá `DiscussPostVote` + tăng/giảm `upvoteCount` (mirror pattern `store.service.ts purchaseItem` dùng `$transaction`).

- [x] **BE: seed data**
  📍 `server/seed-discuss.ts` (root, mirror `seed-shop-items.ts`) — vài bài viết mẫu (có bài gắn `problemId`, có bài không), vài tag tái dùng từ `Tag` có sẵn hoặc thêm mới (`Algorithms`, `System Design`, `Career Advice`...), vài comment mẫu.

- [ ] **FE: feature folder `discuss` + route + nav**
  📍 `client/src/features/discuss/` mirror cấu trúc `store/`/`quest/` (`api/hooks/components/pages/types`):
  - `api/discuss-api.ts`: `getPosts(filters)`, `getPost(id)`, `createPost(dto)`, `createComment(postId, dto)`, `toggleUpvote(postId)`, `getTrendingTags()`, `getTopContributors()`.
  - `hooks/`: `use-discuss-posts.ts`, `use-discuss-post.ts`, `use-create-post.ts`, `use-create-comment.ts`, `use-toggle-upvote.ts` (mutation, optimistic hoặc invalidate `["discuss-post", id]`/`["discuss-posts"]`), `use-trending-tags.ts`, `use-top-contributors.ts`.
  - `components/discuss-post-card.tsx` (list item — avatar/tên/thời gian/tiêu đề/excerpt/tag pill/view-comment-upvote stats, theo đúng bố cục mockup), `discuss-filter-bar.tsx` (nút Lọc = dropdown tag/problem-only, nút sort = dropdown Mới nhất/Nhiều view/Nhiều upvote, dùng shadcn `DropdownMenu` đã có sẵn), `create-post-dialog.tsx` (Dialog: title input, content Textarea, tag multi-select, problem Select optional — mở từ nút "Tạo bài viết mới"), `discuss-trending-tags-card.tsx`, `discuss-top-contributors-card.tsx` (rank badge + avatar + tên + điểm, style giống `contest-leaderboard-table.tsx` phần medal top 3), `discuss-community-rules-card.tsx` (nội dung tĩnh từ i18n, danh sách checkmark).
  - `pages/discuss-list-page.tsx`: layout `grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6` — cột trái list post card + filter bar, cột phải 3 card sidebar, theo đúng bố cục 2 cột đã dùng ở `quest-hub-page.tsx`.
  - `pages/discuss-post-page.tsx`: chi tiết bài + list comment + form comment.
  - `types/index.ts`.
  📍 `client/src/app/router-instance.tsx` — thêm `{ path: "discuss", element: <DiscussListPage /> }`, `{ path: "discuss/:postId", element: <DiscussPostPage /> }` vào children `DashboardLayout` (cùng tầng `contests`/`contests/:id`).
  📍 `client/src/components/layout/dashboard-header.tsx:15` — đổi `href: "#"` → `href: "/discuss"`.
  📍 `client/src/components/layout/dashboard-sidebar.tsx` — thêm entry `{ icon: MessageSquare, labelKey: "sidebar.discuss", href: "/discuss" }` (cùng danh sách `Trophy`/`Lock`/`Compass`/`Users` hiện có).
  📍 i18n: `client/src/lib/i18n/locales/{vi,en,ja}/discuss.json` (namespace mới) — title/subtitle, card labels, filter/sort labels, create-post form labels, sidebar widget titles, community rules text, error/empty states. Thêm `sidebar.discuss` vào `common.json` 3 locale (mirror các `sidebar.*` key có sẵn).

- [ ] **FE: tab "Thảo luận" trong problem panel (gắn theo từng bài)**
  📍 `client/src/features/interview/components/problem-panel.tsx` — thêm `TabsTrigger value="discuss"` (icon `MessageSquare`, theo đúng khuôn `editorial`/`solutions` đã có) + `TabsContent value="discuss"` render `<DiscussTab problemId={problemId} />` (component mới, tái dùng `DiscussPostCard`/hooks từ feature `discuss`, gọi `GET /discuss?problemId=...`, có nút thu gọn "Tạo bài viết mới" mở `create-post-dialog.tsx` với `problemId` prefill).
  `ProblemPanelProps` thêm `problemId?: string`.
  📍 `client/src/features/interview/pages/interview-room.tsx` — truyền `problemId={session.problemId}` vào `<ProblemPanel />`.

---

## 🟡 P1 — Sidebar widget thật, view count, i18n đầy đủ, test

- [ ] **FE: nối "Chủ đề Nổi Bật" và "Đóng Góp Nổi Bật" với API thật**
  📍 `discuss-trending-tags-card.tsx`/`discuss-top-contributors-card.tsx` dùng `use-trending-tags.ts`/`use-top-contributors.ts` (đã tạo khung ở P0, P1 là lúc nối UI thật + loading/empty state).

- [ ] **BE: tăng `viewCount` khi xem chi tiết bài**
  📍 `discuss.service.ts getPostById()` — tăng đơn giản mỗi lần gọi (chấp nhận có thể bị inflate do refresh nhiều lần, ghi rõ giới hạn trong comment, giống mức độ đơn giản hoá đã chấp nhận ở view/count khác trong repo — không làm dedupe theo session phức tạp ở P1).

- [ ] **i18n**: rà lại `discuss.json` 3 locale đầy đủ key đã dùng ở P0 (nếu P0 làm tắt 1 locale để verify nhanh thì P1 hoàn thiện nốt 2 locale còn lại).

- [ ] **BE: test suite `discuss.service.spec.ts`**
  📍 `server/src/modules/discuss/discuss.service.spec.ts`, style mock giống `judge.service.spec.ts`/`store.service.spec.ts`. Case: tạo bài thành công, vote toggle đúng (vote rồi unvote không lệch count), tạo comment tăng đúng `commentCount`, filter theo `problemId` đúng, guest (không JWT) vẫn GET được list/detail.

---

## 🟢 P2 — Mở rộng (ngoài scope hiện tại)

- [ ] **Reply lồng nhau cho comment** (`DiscussComment.parentId` tự tham chiếu) + vote comment (`DiscussCommentVote`).
- [ ] **Report/flag bài viết vi phạm** + màn hình duyệt cho admin (`RolesGuard` + `@Roles('ADMIN')`, chưa có tiền lệ nào trong repo — thiết kế mới hoàn toàn).
- [ ] **Sửa/xoá bài viết của chính mình**, markdown editor có preview thay vì textarea thô.
- [ ] **Thông báo real-time** khi có người trả lời bài/comment của mình (Socket.io, tái dùng pattern `career.gateway`/`chat.gateway` đã có).
- [ ] **Dedupe view count** theo session/IP thay vì tăng vô điều kiện.

---

## Ghi chú thứ tự ưu tiên
DB đi trước BE, BE đi trước FE. Trong P0, task "tab Discuss trong problem panel" phụ thuộc feature folder `discuss` (hooks/components) đã có từ task FE ngay trước đó — làm sau cùng trong P0. Seed data nên chạy sau khi module `discuss` đã có API GET để verify bằng cách gọi thử, không chỉ chạy script rồi để đó (đúng bài học đã ghi ở roadmap Store).
