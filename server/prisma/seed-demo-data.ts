// Dev-only demo data cho Admin Dashboard (Sessions Over Time / Session
// Funnel / Acceptance by Difficulty ...). KHÔNG wire vào `npx prisma db
// seed` mặc định (seed.ts) — chạy riêng qua `npm run seed:demo`. Idempotent:
// mọi user demo dùng chung domain email @demo.algominds.dev, script tự xoá
// sạch slice demo cũ (cascade xoá Session/Submission/UserStats qua User)
// trước khi tạo lại, không đụng tới user/session thật khác trong DB.
import { PrismaClient, SessionStatus, SubmissionStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL_DOMAIN = 'demo.algominds.dev';
const DEMO_USER_COUNT = 8;
const DAYS_BACK = 90;

const DEMO_NAMES = [
  'Alice Nguyen',
  'Bao Tran',
  'Chi Le',
  'Duc Pham',
  'Emi Sato',
  'Felix Kim',
  'Giang Vu',
  'Hana Ito',
];

// Nghiêng về COMPLETED cho gần với tỉ lệ quan sát được ở DB dev thật
// (~60% completion rate) thay vì chia đều 4 trạng thái.
const SESSION_STATUSES: SessionStatus[] = [
  'PHASE_1_STRATEGY',
  'PHASE_2_IMPLEMENT',
  'COMPLETED',
  'COMPLETED',
  'COMPLETED',
  'ABANDONED',
];

const SUBMISSION_STATUSES: SubmissionStatus[] = [
  'ACCEPTED',
  'ACCEPTED',
  'WRONG_ANSWER',
  'RUNTIME_ERROR',
  'TLE',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log('🌱 Seeding demo data (dev-only)...');

  const problems = await prisma.problem.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  if (problems.length === 0) {
    throw new Error(
      'Không có problem nào trong DB — chạy `npm run sync:problems` hoặc `npx prisma db seed` trước.',
    );
  }

  await prisma.user.deleteMany({
    where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
  });

  const passwordHash = await bcrypt.hash('Demo@12345', 10);

  for (let i = 0; i < DEMO_USER_COUNT; i++) {
    const name = DEMO_NAMES[i] ?? `Demo User ${i + 1}`;
    const email = `demo-user-${i + 1}@${DEMO_EMAIL_DOMAIN}`;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: passwordHash,
        provider: 'email',
        role: 'USER',
      },
    });

    const sessionCount = randomInt(3, 8);
    let totalSolved = 0;

    for (let s = 0; s < sessionCount; s++) {
      const status = randomPick(SESSION_STATUSES);
      const problem = randomPick(problems);
      const startedAt = daysAgo(randomInt(0, DAYS_BACK));
      const finishedAt =
        status === 'COMPLETED' || status === 'ABANDONED'
          ? new Date(startedAt.getTime() + randomInt(10, 90) * 60 * 1000)
          : null;

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          problemId: problem.id,
          status,
          startedAt,
          finishedAt,
        },
      });

      if (status === 'PHASE_2_IMPLEMENT' || status === 'COMPLETED') {
        const submissionCount = randomInt(1, 3);
        for (let sub = 0; sub < submissionCount; sub++) {
          const isLastSubmission = sub === submissionCount - 1;
          const subStatus: SubmissionStatus =
            status === 'COMPLETED' && isLastSubmission
              ? 'ACCEPTED'
              : randomPick(SUBMISSION_STATUSES);

          await prisma.submission.create({
            data: {
              sessionId: session.id,
              code: '// demo submission',
              language: 'javascript',
              status: subStatus,
              passedTests: subStatus === 'ACCEPTED' ? 5 : randomInt(0, 4),
              totalTests: 5,
              createdAt: new Date(
                startedAt.getTime() + (sub + 1) * randomInt(2, 20) * 60 * 1000,
              ),
            },
          });
        }
      }

      if (status === 'COMPLETED') totalSolved += 1;
    }

    await prisma.userStats.create({
      data: {
        userId: user.id,
        totalSessions: sessionCount,
        totalSolved,
        averageScore: totalSolved > 0 ? randomInt(60, 95) : 0,
        streakDays: randomInt(0, 14),
        credits: randomInt(0, 20),
        coins: randomInt(0, 500),
      },
    });

    console.log(
      `  ✓ ${email} — ${sessionCount} sessions, ${totalSolved} solved`,
    );
  }

  console.log('✅ Demo data seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
