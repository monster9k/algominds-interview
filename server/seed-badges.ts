/**
 * seed-badges.ts
 *
 * Standalone seeder for the `Badge` catalog — same "separate script, not
 * prisma/seed.ts" pattern as sync-problems.ts / seed-quest.ts, since this is
 * content data meant to be re-run manually when adding more badges, not part
 * of the one-shot `prisma db seed` flow.
 *
 * `key` is the stable identifier earning-rule logic in quest.service.ts
 * checks against — `name`/`description` are display text and can be edited
 * freely by re-running this script (upsert on `key`).
 *
 * Usage:
 *   npx ts-node seed-badges.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Giữ đồng bộ với BADGE_RULES trong server/src/modules/quest/quest.service.ts
// — mỗi `key` ở đây phải có 1 rule tương ứng ở đó thì badge mới thật sự được
// trao, ngược lại badge chỉ nằm im trong catalog không ai đạt được.
const BADGES: Array<{
  key: string;
  name: string;
  description: string;
  iconKey: string;
}> = [
  {
    key: 'first_attempt',
    name: 'Người mới bắt đầu',
    description: 'Hoàn thành ván Quest đầu tiên.',
    iconKey: 'swords',
  },
  {
    key: 'combo_5',
    name: 'Chuỗi combo x5',
    description: 'Đạt combo từ 5 trở lên trong 1 ván.',
    iconKey: 'flame',
  },
  {
    key: 'perfect_run',
    name: 'Không trượt phát nào',
    description: 'Trả lời đúng ít nhất 5 câu, không sai câu nào trong 1 ván.',
    iconKey: 'star',
  },
  {
    key: 'hard_master',
    name: 'Bậc thầy Hard',
    description: 'Hoàn thành hoàn hảo (không sai câu nào) ở độ khó Hard.',
    iconKey: 'crown',
  },
  {
    key: 'speed_runner',
    name: 'Tốc độ ánh sáng',
    description:
      'Trả lời đúng ít nhất 5 câu với tốc độ trung bình dưới 3 giây/câu.',
    iconKey: 'zap',
  },
];

async function main() {
  console.log(`🔄  Seeding ${BADGES.length} badge(s)...`);

  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {
        name: badge.name,
        description: badge.description,
        iconKey: badge.iconKey,
      },
      create: badge satisfies Prisma.BadgeCreateInput,
    });
  }

  console.log('✅  Done — badge catalog is up to date.');
}

main()
  .catch((err) => {
    console.error('❌  Badge seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
