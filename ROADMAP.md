# 🗺️ AlgoMinds — Roadmap: Store (Cửa Hàng — xu & vật phẩm cosmetic)

> Bản roadmap trước (Contest v2: nộp bài thật qua Piston, admin tạo contest random, redesign UI) đã hoàn thành 100% ở P0/P1 và merge vào `main` — xem lịch sử git (commit cuối chỉnh sửa: `5fabde5`) nếu cần tham chiếu lại nội dung cũ. P2 của bản đó (Admin Panel UI, chế độ luyện tập FINISHED, roster đăng ký, AI evaluation cho contest) vẫn còn treo nhưng nằm ngoài scope hiện tại — không đụng tới trong roadmap này.
> Bản này thay thế nó. Lý do: mục "Cửa Hàng" trên nav header đã có sẵn label (`nav.store` trong `common.json`) nhưng `href: "#"` — placeholder chết y hệt kiểu `nav.contest` từng bị trước khi fix. Yêu cầu sản phẩm: mỗi ngày đăng nhập nhận 1 xu, hoàn thành bài tập nhận thêm xu, xu dùng để đổi vật phẩm cosmetic (khung avatar, danh hiệu, màu badge — chưa cần asset ảnh thật). Đây là tính năng from-scratch hoàn toàn: không có model `Item`/`Shop`/`Inventory` nào tồn tại, `UserStats.credits` hiện có là quota chat AI (bị trừ dần khi nhắn tin) — đã có quyết định sản phẩm trước đó (comment ở `schema.prisma:310-312`, trên `UserPersonaUnlock`) là **không đụng vào field này** khi làm tính năng kiểu Store, nên phải thêm field/model mới hoàn toàn.

## Cách đọc file này
- `🔴 P0` — Lõi bắt buộc: schema DB (xu + vật phẩm), thưởng xu đăng nhập hàng ngày (auth hook), thưởng xu khi giải bài (judge hook, kèm fix farm-bug bắt buộc), module `store` (BE: xem catalog/túi đồ/mua), seed data, FE route + nav + trang Store cơ bản (xem + mua).
- `🟡 P1` — Hoàn thiện: equip/unequip UI, chip số dư xu ở header, toast thưởng xu, i18n đầy đủ 3 ngôn ngữ, test suite (`auth`, `judge`, `store`).
- `🟢 P2` — Mở rộng (ngoài scope hiện tại, ghi lại để làm sau): item có ảnh thật thay icon/màu, streak-based bonus xu, leaderboard "giàu nhất", Admin UI quản lý catalog item.
- Mỗi task ghi **vị trí code** liên quan để bắt tay vào làm ngay.
- **Lưu ý thứ tự bắt buộc**: task DB schema (P0, mục đầu tiên) phải xong trước mọi task BE khác. Task "thưởng xu khi giải bài" ở `judge.service.ts` bắt buộc kèm fix farm-bug (check đã từng ACCEPTED bài này chưa) trong cùng 1 commit — không tách riêng, vì nếu thưởng xu mà không fix thì user farm xu vô hạn bằng resubmit.

---

## 🔴 P0 — Xu (coins) + vật phẩm cosmetic + trang Store cơ bản

- [ ] **DB: thêm field xu + model vật phẩm**
  📍 `server/prisma/schema.prisma`.
  - `UserStats` thêm `coins Int @default(0)` và `lastDailyRewardAt DateTime?` (ngày cuối đã claim xu điểm danh, so theo **ngày UTC**).
  - Model mới:
    ```prisma
    enum ShopItemCategory {
      AVATAR_FRAME
      TITLE
      BADGE_COLOR
    }

    model ShopItem {
      id          String           @id @default(uuid())
      key         String           @unique
      name        String
      description String
      category    ShopItemCategory
      price       Int
      iconKey     String           // lucide icon name hoặc mã màu, FE tự map — không lưu ảnh
      createdAt   DateTime         @default(now())
      users UserItem[]
      @@map("shop_items")
    }

    model UserItem {
      id          String   @id @default(uuid())
      userId      String
      itemId      String
      purchasedAt DateTime @default(now())
      equipped    Boolean  @default(false)
      user User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      item ShopItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
      @@unique([userId, itemId])
      @@map("user_items")
    }
    ```
  - Thêm `userItems UserItem[]` vào `User` model.
  - "Equip theo category" (chỉ 1 item equipped/category) xử lý ở service layer, không ép bằng DB constraint.
  - Áp dụng bằng `npx prisma db push` (đúng convention prototype repo đang dùng cho model mới, xem tiền lệ `ContestSubmission`), sau đó `npx prisma generate`.

- [ ] **BE: xu điểm danh hàng ngày (daily login)**
  📍 `server/src/modules/users/users.service.ts` — thêm `recordDailyLogin(userId)`: so `UserStats.lastDailyRewardAt` (phần ngày UTC) với hôm nay; khác/null → `upsert` `coins: { increment: 1 }`, `lastDailyRewardAt: new Date()`, trả `{ awarded, coins }`; cùng ngày → no-op, trả `{ awarded: false }`.
  📍 `server/src/modules/auth/auth.service.ts` — gọi `usersService.recordDailyLogin(user.id)`:
  - Trong `login()` (email/password), trước khi return token.
  - Trong `validateGoogleUser()` nhánh **user đã tồn tại** (hiện chỉ `return user`).
  - **Không** gọi trong `refreshTokens()` — không phải hành vi "đăng nhập" thật, chạy tự động/lặp lại nhiều lần/ngày.
  - `auth.service.spec.ts` (test suite sẵn có, phải giữ pass): mock `usersService.recordDailyLogin`, assert gọi đúng 1 lần ở `login()` và nhánh existing-user của Google OAuth.

- [ ] **BE: xu khi giải bài đúng (kèm fix farm-bug bắt buộc)**
  📍 `server/src/modules/judge/judge.service.ts`, trong `$transaction` của `submitCode()` (dòng ~110-160).
  - Trước khi tạo `savedSubmission`: query `tx.submission.findFirst({ where: { status: 'ACCEPTED', session: { userId, problemId: session.problemId } } })` → `hasSolvedBefore`.
  - Nhánh `finalStatus === ACCEPTED`: luôn cộng `coins: { increment: COINS_BY_DIFFICULTY[session.problem.difficulty] }` (hằng số mới, ví dụ Easy 10 / Medium 20 / Hard 30 — thang riêng, không trùng `POINTS_BY_DIFFICULTY` của contest); chỉ cộng `totalSolved: { increment: 1 }` khi `!hasSolvedBefore` (đây là chỗ tiện fix luôn farm-bug cũ của `totalSolved` — dùng chung 1 query, ghi rõ trong commit message đây là side-effect cần thiết, không phải dọn dẹp ngoài phạm vi).
  - Trả thêm `coinsAwarded` (0 nếu đã giải trước đó) trong response `submitCode()`.
  - `judge.service.spec.ts`: thêm test "đã ACCEPTED bài này trước đó → không cộng coins/totalSolved lần 2", "ACCEPTED lần đầu → cộng đúng coins theo difficulty".

- [ ] **BE: module `store` mới (catalog, túi đồ, mua)**
  📍 `server/src/modules/store/` (`store.module.ts`, `store.controller.ts`, `store.service.ts`, `dto/`), tham khảo `quest` module cho awarding-pattern, `problems` module cho pattern guard.
  ```
  GET  /store/items               OptionalJwtAuthGuard   → catalog + owned/equipped flag nếu có user
  GET  /store/inventory           JwtAuthGuard           → item đã mua của tôi
  POST /store/purchase/:itemId    JwtAuthGuard           → mua item
  ```
  `purchaseItem(userId, itemId)`: `$transaction` — check `UserStats.coins >= item.price`, check chưa sở hữu (`UserItem` unique constraint), `coins: { decrement: price }`, `userItem.create`. `ConflictException` nếu đã sở hữu, `BadRequestException` nếu không đủ xu.
  Không đổi shape lớn của `GET /users/me` — chỉ thêm `coins` vào `UserStats` select sẵn có.

- [ ] **BE: seed data vật phẩm**
  📍 `server/seed-shop-items.ts` (root, mirror `seed-badges.ts`) — catalog ~6-8 item cosmetic (2-3 khung avatar, 2-3 danh hiệu, 2-3 màu badge), giá xu khác nhau theo độ hiếm, `upsert` theo `key`. Không wire vào `package.json`, chạy tay `npx ts-node seed-shop-items.ts`.

- [ ] **FE: feature folder `store` + route + nav**
  📍 `client/src/features/store/` mirror cấu trúc `quest/` (`api/hooks/components/pages/types`):
  - `api/store-api.ts`: `getItems`, `getInventory`, `purchaseItem`.
  - `hooks/use-store-items.ts`, `use-my-inventory.ts` (pattern `enabled: !isAuthLoading && isAuthenticated` từ `use-user-profile.ts`), `use-purchase-item.ts` (mutation, toast, invalidate `["store-items"]`/`["store-inventory"]`/`["user-profile"]`).
  - `components/store-item-card.tsx`, `store-category-tabs.tsx`.
  - `pages/store-page.tsx`: 2 tab "Cửa hàng"/"Túi đồ" (Tabs shadcn).
  - `types/index.ts`.
  📍 `client/src/app/router-instance.tsx` — thêm `{ path: "store", element: <StorePage /> }` trong children `DashboardLayout` (cùng tầng `/quest`), không bọc `ProtectedRoute`.
  📍 `client/src/components/layout/dashboard-header.tsx:16` — đổi `href: "#"` → `href: "/store"`, bỏ `hasDropdown: true`.

---

## 🟡 P1 — Equip UI, hiển thị số dư, toast, i18n, test

- [ ] **BE: endpoint equip vật phẩm**
  📍 `server/src/modules/store/store.controller.ts` + `store.service.ts`.
  ```
  POST /store/items/:itemId/equip   JwtAuthGuard   → equip (unequip item cùng category trước)
  ```

- [ ] **FE: UI equip/unequip + hiển thị item đã trang bị**
  📍 `client/src/features/store/hooks/use-equip-item.ts`, `components/store-item-card.tsx` (nút Trang bị/Đã trang bị).
  Cân nhắc hiển thị item đã equip trên `profile-info-card.tsx` (khung avatar/danh hiệu).

- [ ] **FE: chip số dư xu ở header**
  📍 `client/src/components/layout/dashboard-header.tsx` — icon `Coins` + số, lấy từ `useUserProfile()` sẵn có (`features/users/hooks/use-user-profile.ts`), không tạo hook/API riêng chỉ để lấy số dư.

- [ ] **FE: toast thưởng xu**
  📍 Login thành công + `awarded: true` từ BE → toast "+1 xu điểm danh hôm nay". Sau submit ACCEPTED có `coinsAwarded > 0` (hook `use-judge.ts` hiện có) → toast "+X xu".

- [ ] **i18n: `store.json` cho 3 ngôn ngữ**
  📍 `client/src/lib/i18n/locales/{en,vi,ja}/store.json` — title, tabs, item card (price/owned/equip/equipped/buy/insufficientCoins), toast messages. Key `nav.store` đã có sẵn trong `common.json`, không cần thêm.

- [ ] **BE: test suite `store.service.spec.ts`**
  📍 `server/src/modules/store/store.service.spec.ts`, style mock giống `judge.service.spec.ts`. Case: not-found item, không đủ xu, đã sở hữu, mua thành công trừ đúng xu, equip unequip đúng category.

---

## 🟢 P2 — Mở rộng (ngoài scope hiện tại)

- [ ] **Item có ảnh thật**: thay icon/màu bằng asset hình ảnh thật cho khung avatar/trang phục.
- [ ] **Streak-based bonus xu**: gắn `UserStats.streakDays` (hiện là field chết) vào thưởng xu tăng dần theo chuỗi ngày đăng nhập liên tiếp.
- [ ] **Leaderboard "giàu nhất"**: bảng xếp hạng theo `UserStats.coins`, tham khảo pattern `getLeaderboard()` của `quest.service.ts`.
- [ ] **Admin UI quản lý catalog item**: form tạo/sửa/xoá `ShopItem` thay vì chỉ seed script.

---

## Ghi chú thứ tự ưu tiên

DB đi trước BE, BE đi trước FE — FE cần contract API thật để gọi. Trong P0, task "thưởng xu khi giải bài" ở `judge.service.ts` bắt buộc làm chung với fix farm-bug `totalSolved`, không tách thành 2 commit. Task seed data nên làm sau khi module `store` đã có API GET, để verify luôn bằng cách gọi thử thay vì chỉ chạy script rồi để đó.
