/**
 * seed-shop-items.ts
 *
 * Standalone seeder for the `ShopItem` catalog — same "separate script, not
 * prisma/seed.ts" pattern as seed-badges.ts / seed-quest.ts, since this is
 * content data meant to be re-run manually when adding more items, not part
 * of the one-shot `prisma db seed` flow.
 *
 * `key` is the stable identifier the Store module upserts/matches against —
 * `name`/`description`/`price`/`iconKey` are display/config data and can be
 * edited freely by re-running this script (upsert on `key`).
 *
 * Cosmetic-only for now (no image assets): `iconKey` is either a lucide-react
 * icon name (TITLE items — shown next to the title text) or a hex color
 * (AVATAR_FRAME / BADGE_COLOR items — FE renders it directly as a border/fill
 * color), per the comment on ShopItem.iconKey in schema.prisma.
 *
 * Usage:
 *   npx ts-node seed-shop-items.ts
 */

import { PrismaClient, Prisma, ShopItemCategory } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SHOP_ITEMS: Array<{
  key: string;
  name: string;
  description: string;
  category: ShopItemCategory;
  price: number;
  iconKey: string;
}> = [
  {
    key: 'frame_bronze',
    name: 'Khung Đồng',
    description: 'Khung avatar màu đồng, dành cho người mới bắt đầu.',
    category: ShopItemCategory.AVATAR_FRAME,
    price: 15,
    iconKey: '#b08d57',
  },
  {
    key: 'frame_silver',
    name: 'Khung Bạc',
    description: 'Khung avatar màu bạc, nổi bật hơn trên bảng xếp hạng.',
    category: ShopItemCategory.AVATAR_FRAME,
    price: 40,
    iconKey: '#c0c0c0',
  },
  {
    key: 'frame_gold',
    name: 'Khung Vàng',
    description: 'Khung avatar màu vàng, dành cho người chăm chỉ điểm danh.',
    category: ShopItemCategory.AVATAR_FRAME,
    price: 100,
    iconKey: '#ffd700',
  },
  {
    key: 'title_rookie',
    name: 'Tân binh',
    description: 'Danh hiệu hiển thị cạnh tên trên hồ sơ.',
    category: ShopItemCategory.TITLE,
    price: 10,
    iconKey: 'sparkles',
  },
  {
    key: 'title_grinder',
    name: 'Chăm chỉ',
    description: 'Danh hiệu cho những ai giải bài đều đặn mỗi ngày.',
    category: ShopItemCategory.TITLE,
    price: 30,
    iconKey: 'flame',
  },
  {
    key: 'title_legend',
    name: 'Huyền thoại',
    description: 'Danh hiệu cao cấp nhất, dành cho cao thủ thực thụ.',
    category: ShopItemCategory.TITLE,
    price: 150,
    iconKey: 'crown',
  },
  {
    key: 'badge_color_blue',
    name: 'Màu Xanh Dương',
    description: 'Đổi màu badge hiển thị trên hồ sơ sang xanh dương.',
    category: ShopItemCategory.BADGE_COLOR,
    price: 20,
    iconKey: '#3b82f6',
  },
  {
    key: 'badge_color_purple',
    name: 'Màu Tím',
    description: 'Đổi màu badge hiển thị trên hồ sơ sang tím.',
    category: ShopItemCategory.BADGE_COLOR,
    price: 20,
    iconKey: '#a855f7',
  },
];

async function main() {
  console.log(`🔄  Seeding ${SHOP_ITEMS.length} shop item(s)...`);

  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { key: item.key },
      update: {
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        iconKey: item.iconKey,
      },
      create: item satisfies Prisma.ShopItemCreateInput,
    });
  }

  console.log('✅  Done — shop item catalog is up to date.');
}

main()
  .catch((err) => {
    console.error('❌  Shop item seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
