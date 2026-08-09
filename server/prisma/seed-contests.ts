import { PrismaClient, ContestStatus, UserRole } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { pickRandomProblemsByDifficulty } from '../src/modules/contest/contest-problem-picker.util';
import { POINTS_BY_DIFFICULTY } from '../src/modules/contest/contest.service';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;

const ADMIN_EMAIL = 'admin@algominds.dev';
const ADMIN_PASSWORD = 'Admin@12345';

// Bootstrap 1 tài khoản ADMIN thật — KHÔNG phải "fake test data" kiểu
// leaderboard giả trước đây (đã xoá hoàn toàn), mà là account hợp lệ duy
// nhất cần thiết để test API `POST /contests` admin-gated khi repo chưa có
// Admin Panel UI. Idempotent (upsert theo email) — chạy lại không tạo trùng.
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

async function attachProblems(
  contestId: string,
  problems: { id: string; difficulty: keyof typeof POINTS_BY_DIFFICULTY }[],
) {
  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    const points = POINTS_BY_DIFFICULTY[problem.difficulty];
    await prisma.contestProblem.upsert({
      where: { contestId_problemId: { contestId, problemId: problem.id } },
      update: { points, order: i },
      create: { contestId, problemId: problem.id, points, order: i },
    });
  }
}

async function main() {
  console.log('🏆 Start seeding contests...');

  const allProblems = await prisma.problem.findMany({
    where: { deletedAt: null },
  });
  if (allProblems.length === 0) {
    throw new Error(
      'Không có Problem nào trong DB — chạy `npx prisma db seed` (hoặc npm run sync:problems) trước khi seed contest.',
    );
  }

  console.log('👤 Bootstrapping admin account...');
  const admin = await upsertAdminAccount();

  const now = Date.now();

  // 1 contest mẫu duy nhất, ONGOING ngay sau khi seed (bắt đầu vài phút
  // trước, kết thúc vài giờ sau) — để dev mới clone repo chạy được full
  // luồng list -> detail -> giải bài -> nộp -> leaderboard mà không cần setup
  // tay. Bài gắn vào contest được chọn NGẪU NHIÊN từ pool Problem có sẵn
  // (không hardcode như trước) qua cùng 1 util mà API tạo contest admin-gated
  // (P1) sẽ dùng. Không còn user giả, không còn ContestSubmission fabricate —
  // leaderboard bắt đầu HOÀN TOÀN TRỐNG, chỉ có data khi có người nộp bài thật.
  console.log('🔥 Seeding "AlgoMinds Weekly CodeSprint #1"...');

  const contest = await prisma.contest.upsert({
    where: { slug: 'weekly-codesprint-1' },
    update: {},
    create: {
      slug: 'weekly-codesprint-1',
      title: 'AlgoMinds Weekly CodeSprint #1',
      description:
        'Cuộc thi lập trình hàng tuần đầu tiên của AlgoMinds — vài bài từ Easy đến Hard, tính điểm và xếp hạng kiểu ICPC: tổng điểm cao nhất thắng, bằng điểm thì ai có tổng thời gian nộp + penalty thấp hơn xếp trên.',
      startTime: new Date(now - 5 * MIN_MS),
      endTime: new Date(now + 3 * HOUR_MS),
      // Chỉ là fallback hiển thị — trạng thái thật luôn được TÍNH theo thời
      // gian thực qua deriveContestStatus() trong contest.service.ts, không
      // đọc cột này cho bất kỳ logic gating nào (xem ROADMAP.md).
      status: ContestStatus.ONGOING,
    },
  });

  // Chỉ random-pick + gắn bài LẦN ĐẦU contest được tạo — nếu đã có
  // ContestProblem thì giữ nguyên, không random lại mỗi lần chạy seed (random
  // pick + upsert theo contestId_problemId sẽ CHỒNG THÊM bài mới mỗi lần thay
  // vì mỗi lần random ra 1 tổ hợp khác, phá tính idempotent của script).
  const existingCount = await prisma.contestProblem.count({
    where: { contestId: contest.id },
  });
  let attachedCount = existingCount;
  if (existingCount === 0) {
    const picked = pickRandomProblemsByDifficulty(
      allProblems,
      { easy: 2, medium: 2, hard: 1 },
      { strict: false }, // best-effort — DB dev còn ít bài không được để crash seed
    );
    await attachProblems(contest.id, picked);
    attachedCount = picked.length;
  }

  console.log('✅ Seeding contests finished.');
  console.log(
    `   Contest "${contest.title}": ${attachedCount} problems attached${existingCount === 0 ? ' (random pick)' : ' (already seeded, unchanged)'}.`,
  );
  console.log(
    `   Admin account để test POST /contests: ${admin.email} / ${ADMIN_PASSWORD}`,
  );
  console.log(
    '   Leaderboard đang trống — giải + nộp 1 bài thật trong contest để thấy dữ liệu.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
