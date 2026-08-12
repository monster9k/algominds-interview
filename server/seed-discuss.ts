/**
 * seed-discuss.ts
 *
 * Standalone seeder for a few sample Discuss posts/comments — same
 * "separate script, not prisma/seed.ts" pattern as seed-badges.ts /
 * seed-shop-items.ts, re-run manually when you want more sample content.
 *
 * Author: reuses the single real admin account bootstrapped by
 * prisma/seed-contests.ts (admin@algominds.dev) instead of fabricating fake
 * users — same product decision already made for contest leaderboard data
 * (see comment above upsertAdminAccount() in prisma/seed-contests.ts).
 *
 * DiscussPost has no natural unique key to upsert on, so idempotency here is
 * "skip if a post with this exact title already exists" rather than a real
 * upsert — fine for sample/demo content, re-running won't duplicate.
 *
 * Usage:
 *   npx ts-node seed-discuss.ts
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import slugify from 'slugify';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = 'admin@algominds.dev';
const ADMIN_PASSWORD = 'Admin@12345';

async function upsertAdminAccount() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: UserRole.ADMIN },
    create: {
      email: ADMIN_EMAIL,
      name: 'Contest Admin',
      provider: 'seed',
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });
}

function connectTags(tagNames: string[]) {
  return tagNames.map((name) => ({
    tag: {
      connectOrCreate: {
        where: { name },
        create: { name, slug: slugify(name, { lower: true, strict: true }) },
      },
    },
  }));
}

interface SeedPost {
  title: string;
  content: string;
  tagNames: string[];
  problemSlug?: string;
  comments: string[];
}

const SEED_POSTS: SeedPost[] = [
  {
    title: 'Tối ưu hoá thuật toán Dijkstra trong đồ thị thưa',
    content:
      'Chào mọi người, mình đang gặp vấn đề về hiệu suất khi triển khai Dijkstra bằng priority queue cho một đồ thị rất lớn nhưng thưa thớt (sparse graph). Có cách nào tối ưu hơn không?',
    tagNames: ['Algorithms', 'C++'],
    comments: [
      'Bạn thử dùng binary heap thay vì array tuyến tính xem, độ phức tạp sẽ giảm từ O(V^2) xuống O((V+E)logV).',
    ],
  },
  {
    title: 'Kinh nghiệm phỏng vấn System Design tại Big Tech',
    content:
      'Mình vừa pass vòng System Design tại một công ty công nghệ lớn. Chia sẻ với anh em một số tip về cách trình bày ý tưởng, quản lý thời gian và những sai lầm phổ biến.',
    tagNames: ['Career Advice', 'System Design'],
    comments: [
      'Cảm ơn bạn đã chia sẻ, mình cũng sắp phỏng vấn vòng này!',
      'Bạn có thể nói rõ hơn về cách ước lượng capacity không?',
    ],
  },
  {
    title: 'Hướng dẫn giải Two Sum bằng Hash Map trong O(n)',
    content:
      'Nhiều bạn mới vẫn giải Two Sum bằng 2 vòng lặp lồng nhau (O(n^2)). Bài này mình chia sẻ cách dùng Hash Map để đưa về O(n) — vừa duyệt vừa lưu lại giá trị đã thấy.',
    tagNames: ['Algorithms', 'Hash Table'],
    problemSlug: 'two-sum',
    comments: ['Giải thích dễ hiểu quá, cảm ơn bạn!'],
  },
  {
    title: 'Stack vs Queue khi giải Valid Parentheses — tại sao Stack đúng?',
    content:
      'Mình thấy nhiều bạn nhầm lẫn dùng Queue thay vì Stack cho bài này. Cùng phân tích tại sao tính chất LIFO của Stack lại khớp với cách các dấu ngoặc cần được đóng đúng thứ tự.',
    tagNames: ['Algorithms', 'DynamicProgramming'],
    problemSlug: 'valid-parentheses',
    comments: [],
  },
  {
    title: 'Roadmap tự học ReactJS cho người mới 2026',
    content:
      'Tổng hợp lộ trình mình đã đi qua để tự học ReactJS từ con số 0: bắt đầu từ JSX/component cơ bản, sau đó tới hooks, state management (Zustand/Redux), rồi mới tới các pattern nâng cao.',
    tagNames: ['ReactJS', 'Career Advice'],
    comments: [],
  },
];

async function main() {
  console.log('👤 Bootstrapping admin account (post author)...');
  const admin = await upsertAdminAccount();

  console.log(`🔄  Seeding ${SEED_POSTS.length} discuss post(s)...`);

  for (const seedPost of SEED_POSTS) {
    const existing = await prisma.discussPost.findFirst({
      where: { title: seedPost.title, deletedAt: null },
    });
    if (existing) {
      console.log(`  ⏭️  Skip (already exists): ${seedPost.title}`);
      continue;
    }

    let problemId: string | undefined;
    if (seedPost.problemSlug) {
      const problem = await prisma.problem.findUnique({
        where: { slug: seedPost.problemSlug },
        select: { id: true },
      });
      if (!problem) {
        console.warn(
          `  ⚠️  Problem slug "${seedPost.problemSlug}" not found — creating "${seedPost.title}" as a general post instead.`,
        );
      }
      problemId = problem?.id;
    }

    const post = await prisma.discussPost.create({
      data: {
        authorId: admin.id,
        problemId,
        title: seedPost.title,
        content: seedPost.content,
        commentCount: seedPost.comments.length,
        tags: { create: connectTags(seedPost.tagNames) },
      },
    });

    for (const commentContent of seedPost.comments) {
      await prisma.discussComment.create({
        data: { postId: post.id, authorId: admin.id, content: commentContent },
      });
    }

    console.log(`  ✅  Created: ${seedPost.title}`);
  }

  console.log('✅  Done — discuss sample content is up to date.');
}

main()
  .catch((err) => {
    console.error('❌  Discuss seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
