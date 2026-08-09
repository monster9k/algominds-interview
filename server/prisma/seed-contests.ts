import {
  PrismaClient,
  Difficulty,
  ContestStatus,
  SubmissionStatus,
  Problem,
} from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;
const WRONG_PENALTY_MINUTES = 20;

// Điểm theo độ khó khi seed — Contest.points là field độc lập trên
// ContestProblem, đây chỉ là mức mặc định lúc dựng dữ liệu mẫu.
const POINTS_BY_DIFFICULTY: Record<Difficulty, number> = {
  EASY: 100,
  MEDIUM: 300,
  HARD: 500,
};

const MOCK_PASSWORD = 'Contest@12345';

const MOCK_USERS = [
  { email: 'contest.player1@algominds.dev', name: 'Minh Anh' },
  { email: 'contest.player2@algominds.dev', name: 'Quốc Bảo' },
  { email: 'contest.player3@algominds.dev', name: 'Thu Hà' },
  { email: 'contest.player4@algominds.dev', name: 'Đức Huy' },
  { email: 'contest.player5@algominds.dev', name: 'Ngọc Linh' },
  { email: 'contest.player6@algominds.dev', name: 'Hoàng Nam' },
];

async function upsertMockUsers() {
  const passwordHash = await bcrypt.hash(MOCK_PASSWORD, 10);
  const users = await Promise.all(
    MOCK_USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          name: u.name,
          provider: 'seed',
          password: passwordHash,
        },
      }),
    ),
  );
  return users;
}

interface AttachedProblem {
  problemId: string;
  points: number;
  problem: Problem;
}

async function attachProblems(
  contestId: string,
  problems: Problem[],
): Promise<AttachedProblem[]> {
  const attached: AttachedProblem[] = [];
  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    const points = POINTS_BY_DIFFICULTY[problem.difficulty];
    await prisma.contestProblem.upsert({
      where: { contestId_problemId: { contestId, problemId: problem.id } },
      update: { points, order: i },
      create: { contestId, problemId: problem.id, points, order: i },
    });
    attached.push({ problemId: problem.id, points, problem });
  }
  return attached;
}

// Chọn 1 tổ hợp bài đa dạng độ khó từ pool problem có sẵn trong DB, không tạo
// Problem mới. Nếu pool nghèo (thiếu 1 độ khó nào đó), lấp thêm từ toàn bộ
// allProblems chưa được chọn để contest luôn có ít nhất 2 bài.
function pickProblemSet(
  allProblems: Problem[],
  wanted: { difficulty: Difficulty; count: number }[],
): Problem[] {
  const picked: Problem[] = [];
  for (const { difficulty, count } of wanted) {
    const fromDifficulty = allProblems
      .filter((p) => p.difficulty === difficulty)
      .filter((p) => !picked.some((x) => x.id === p.id))
      .slice(0, count);
    picked.push(...fromDifficulty);
  }
  if (picked.length < 2) {
    for (const p of allProblems) {
      if (picked.length >= 2) break;
      if (!picked.some((x) => x.id === p.id)) picked.push(p);
    }
  }
  return picked;
}

interface SubmissionSpec {
  userIndex: number;
  problemIndex: number;
  wrongBeforeSolve: number;
  // phút tính từ contest.startTime của lần nộp ACCEPTED; null = chưa giải được bài này
  solveAtMinute: number | null;
}

async function seedSubmissions(
  contest: { id: string; slug: string; startTime: Date },
  contestProblems: AttachedProblem[],
  users: { id: string; email: string }[],
  specs: SubmissionSpec[],
): Promise<number> {
  let created = 0;

  const validSpecs = specs.filter(
    (s) =>
      s.userIndex < users.length && s.problemIndex < contestProblems.length,
  );

  for (const spec of validSpecs) {
    const user = users[spec.userIndex];
    const cp = contestProblems[spec.problemIndex];
    const localPart = user.email.split('@')[0];
    let attemptIndex = 0;

    for (let w = 0; w < spec.wrongBeforeSolve; w++) {
      const offsetMin =
        spec.solveAtMinute !== null
          ? Math.max(1, spec.solveAtMinute - (spec.wrongBeforeSolve - w) * 3)
          : 5 + w * 5;
      const id = `seed-${contest.slug}-${cp.problem.slug}-${localPart}-${attemptIndex}`;
      await prisma.contestSubmission.upsert({
        where: { id },
        update: {},
        create: {
          id,
          contestId: contest.id,
          userId: user.id,
          problemId: cp.problemId,
          status: SubmissionStatus.WRONG_ANSWER,
          submittedAt: new Date(
            contest.startTime.getTime() + offsetMin * MIN_MS,
          ),
          penaltyMinutes: WRONG_PENALTY_MINUTES,
        },
      });
      attemptIndex++;
      created++;
    }

    if (spec.solveAtMinute !== null) {
      const id = `seed-${contest.slug}-${cp.problem.slug}-${localPart}-${attemptIndex}`;
      await prisma.contestSubmission.upsert({
        where: { id },
        update: {},
        create: {
          id,
          contestId: contest.id,
          userId: user.id,
          problemId: cp.problemId,
          status: SubmissionStatus.ACCEPTED,
          submittedAt: new Date(
            contest.startTime.getTime() + spec.solveAtMinute * MIN_MS,
          ),
          penaltyMinutes: 0,
        },
      });
      created++;
    }
  }

  return created;
}

async function main() {
  console.log('🏆 Start seeding contests...');

  const allProblems = await prisma.problem.findMany({
    orderBy: { createdAt: 'asc' },
  });
  if (allProblems.length === 0) {
    throw new Error(
      'Không có Problem nào trong DB — chạy `npx prisma db seed` (hoặc npm run sync:problems) trước khi seed contest.',
    );
  }

  console.log('👤 Seeding mock users...');
  const users = await upsertMockUsers();

  const now = Date.now();

  // ===============================
  // CONTEST 1 — đã kết thúc, leaderboard đầy đủ
  // ===============================
  console.log('🏁 Seeding "AlgoMinds Weekly CodeSprint #1"...');

  const contest1 = await prisma.contest.upsert({
    where: { slug: 'weekly-codesprint-1' },
    update: {},
    create: {
      slug: 'weekly-codesprint-1',
      title: 'AlgoMinds Weekly CodeSprint #1',
      description:
        'Cuộc thi lập trình hàng tuần đầu tiên của AlgoMinds — 5 bài từ Easy đến Hard trong 2 giờ, tính điểm và xếp hạng kiểu ICPC: tổng điểm cao nhất thắng, bằng điểm thì ai có tổng thời gian nộp + penalty thấp hơn xếp trên.',
      startTime: new Date(now - 3 * 24 * HOUR_MS),
      endTime: new Date(now - 3 * 24 * HOUR_MS + 2 * HOUR_MS),
      status: ContestStatus.FINISHED,
    },
  });

  const contest1ProblemPicks = pickProblemSet(allProblems, [
    { difficulty: Difficulty.EASY, count: 2 },
    { difficulty: Difficulty.MEDIUM, count: 2 },
    { difficulty: Difficulty.HARD, count: 1 },
  ]);
  const contest1Problems = await attachProblems(
    contest1.id,
    contest1ProblemPicks,
  );

  const contest1Created = await seedSubmissions(
    contest1,
    contest1Problems,
    users,
    [
      // User 1 — dẫn đầu: giải hết 5 bài, ít sai
      { userIndex: 0, problemIndex: 0, wrongBeforeSolve: 0, solveAtMinute: 10 },
      { userIndex: 0, problemIndex: 1, wrongBeforeSolve: 0, solveAtMinute: 22 },
      { userIndex: 0, problemIndex: 2, wrongBeforeSolve: 1, solveAtMinute: 45 },
      { userIndex: 0, problemIndex: 3, wrongBeforeSolve: 0, solveAtMinute: 70 },
      {
        userIndex: 0,
        problemIndex: 4,
        wrongBeforeSolve: 1,
        solveAtMinute: 105,
      },
      // User 2 — giải 3/5 bài, penalty đáng kể do nộp sai
      { userIndex: 1, problemIndex: 0, wrongBeforeSolve: 1, solveAtMinute: 15 },
      { userIndex: 1, problemIndex: 1, wrongBeforeSolve: 0, solveAtMinute: 30 },
      { userIndex: 1, problemIndex: 2, wrongBeforeSolve: 2, solveAtMinute: 90 },
      {
        userIndex: 1,
        problemIndex: 3,
        wrongBeforeSolve: 2,
        solveAtMinute: null,
      },
      // User 3 — chỉ giải 1 bài Easy, có sai trước khi đúng
      { userIndex: 2, problemIndex: 0, wrongBeforeSolve: 1, solveAtMinute: 40 },
      // User 4 — giải 2 bài Easy nhanh, không sai
      { userIndex: 3, problemIndex: 0, wrongBeforeSolve: 0, solveAtMinute: 8 },
      { userIndex: 3, problemIndex: 1, wrongBeforeSolve: 0, solveAtMinute: 18 },
      // User 5 — có tham gia nhưng chưa giải được bài nào (test hàng leaderboard 0 điểm)
      {
        userIndex: 4,
        problemIndex: 0,
        wrongBeforeSolve: 3,
        solveAtMinute: null,
      },
      // User 6 — không nộp bài nào ở contest này (không xuất hiện trong leaderboard contest 1)
    ],
  );

  // ===============================
  // CONTEST 2 — đang diễn ra
  // ===============================
  console.log('🔥 Seeding "Dynamic Programming Challenge"...');

  const contest2 = await prisma.contest.upsert({
    where: { slug: 'dp-challenge' },
    update: {},
    create: {
      slug: 'dp-challenge',
      title: 'Dynamic Programming Challenge',
      description:
        'Chuyên đề Quy hoạch động — 4 bài Medium/Hard trong 3 giờ. Đang diễn ra, bảng xếp hạng cập nhật theo từng lượt nộp bài.',
      startTime: new Date(now - 2 * HOUR_MS),
      endTime: new Date(now + 1 * HOUR_MS),
      status: ContestStatus.ONGOING,
    },
  });

  const contest2ProblemPicks = pickProblemSet(allProblems, [
    { difficulty: Difficulty.MEDIUM, count: 2 },
    { difficulty: Difficulty.HARD, count: 2 },
  ]);
  const contest2Problems = await attachProblems(
    contest2.id,
    contest2ProblemPicks,
  );

  const contest2Created = await seedSubmissions(
    contest2,
    contest2Problems,
    users,
    [
      // User 2 — dẫn đầu contest này: giải 2 medium + 1 hard
      { userIndex: 1, problemIndex: 0, wrongBeforeSolve: 0, solveAtMinute: 20 },
      { userIndex: 1, problemIndex: 1, wrongBeforeSolve: 1, solveAtMinute: 50 },
      {
        userIndex: 1,
        problemIndex: 2,
        wrongBeforeSolve: 0,
        solveAtMinute: 100,
      },
      // User 1 — giải 1 bài, ít penalty
      { userIndex: 0, problemIndex: 0, wrongBeforeSolve: 0, solveAtMinute: 60 },
      // User 6 — hoà điểm với User 1 (cùng giải 1 bài đó) nhưng penalty cao hơn
      // do nộp sai nhiều lần trước — dùng để test tie-break theo penalty
      { userIndex: 5, problemIndex: 0, wrongBeforeSolve: 2, solveAtMinute: 90 },
    ],
  );

  console.log('✅ Seeding contests finished.');
  console.log(
    `   Contest "${contest1.title}": ${contest1Problems.length} problems, ${contest1Created} submissions upserted.`,
  );
  console.log(
    `   Contest "${contest2.title}": ${contest2Problems.length} problems, ${contest2Created} submissions upserted.`,
  );
  console.log(`   Mock users: ${users.length} (password: ${MOCK_PASSWORD})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
