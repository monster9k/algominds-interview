/**
 * sync-problems.ts
 *
 * File-based problem seeder. Reads every sub-directory under /problems/,
 * parses its assets, and upserts the data into the database via Prisma.
 *
 * Usage:
 *   npx ts-node sync-problems.ts
 *
 * Expected folder layout per problem:
 *   problems/
 *   └── two-sum/
 *       ├── problem.json    – metadata (title, difficulty, functionName, …)
 *       ├── statement.md    – markdown description rendered as HTML on the FE
 *       ├── tests.json      – array of { input, expected, isHidden? }.
 *       │                     isHidden: false (mặc định) -> Problem.sampleTestCases
 *       │                     (public, dùng cho "Run"); isHidden: true -> Problem.hiddenTestCases
 *       │                     (chỉ dùng khi "Submit", không bao giờ trả về client).
 *       ├── templates/
 *       │   ├── typescript.ts
 *       │   ├── javascript.js
 *       │   ├── python.py
 *       │   ├── java.java
 *       │   └── cpp.cpp
 *       └── solution/        – optional, same layout as templates/. A correct,
 *                               working reference solution per language (not just
 *                               a stub) — used as the oracle by
 *                               generate-hidden-testcases.ts to compute expected
 *                               output for admin-supplied inputs. Stored on
 *                               Problem.solution, never exposed to the client.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Difficulty, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProblemMeta {
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  functionName: string;
  timeLimit?: number; // ms
  memoryLimit?: number; // mb
  tags?: string[];
}

interface RawTestCase {
  input: string | Record<string, unknown>;
  expected: string;
  isHidden?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Remove the file extension to use as a language key, e.g. "typescript.ts" → "typescript" */
function langKeyFromFile(fileName: string): string {
  return path.basename(fileName, path.extname(fileName));
}

/**
 * Parse the `input` field from tests.json.
 * It may be a stringified JSON object or already a plain object.
 */
function parseInput(
  raw: string | Record<string, unknown>,
): Record<string, unknown> {
  if (typeof raw === 'string') {
    return JSON.parse(raw) as Record<string, unknown>;
  }
  return raw;
}

/**
 * Convert Markdown to a minimal HTML string.
 * We just wrap it in a <pre> for now; the FE can render it with a Markdown lib.
 */
function mdToHtml(markdown: string): string {
  return markdown;
}

// ---------------------------------------------------------------------------
// Core sync logic for a single problem folder
// ---------------------------------------------------------------------------

async function syncProblem(
  folderName: string,
  problemsDir: string,
): Promise<void> {
  const problemDir = path.join(problemsDir, folderName);
  const metaPath = path.join(problemDir, 'problem.json');

  // Skip folders without a problem.json (e.g. empty or work-in-progress)
  if (!fs.existsSync(metaPath)) {
    console.warn(`  ⚠️  Skipping "${folderName}" — problem.json not found`);
    return;
  }

  // --- 1. Read all assets ---
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as ProblemMeta;

  const statementPath = path.join(problemDir, 'statement.md');
  const content = fs.existsSync(statementPath)
    ? mdToHtml(fs.readFileSync(statementPath, 'utf-8'))
    : '';

  const testsPath = path.join(problemDir, 'tests.json');
  if (!fs.existsSync(testsPath)) {
    console.warn(`  ⚠️  Skipping "${folderName}" — tests.json not found`);
    return;
  }
  const rawTests = JSON.parse(
    fs.readFileSync(testsPath, 'utf-8'),
  ) as RawTestCase[];

  // --- 2. Build initialCode map from templates/ ---
  const templatesDir = path.join(problemDir, 'templates');
  const initialCode: Record<string, string> = {};

  if (fs.existsSync(templatesDir)) {
    for (const file of fs.readdirSync(templatesDir)) {
      const filePath = path.join(templatesDir, file);
      if (fs.statSync(filePath).isFile()) {
        const lang = langKeyFromFile(file);
        initialCode[lang] = fs.readFileSync(filePath, 'utf-8');
      }
    }
  }

  // --- 2b. Build solution map from solution/ (optional oracle for generate-hidden-testcases.ts) ---
  const solutionDir = path.join(problemDir, 'solution');
  const solution: Record<string, string> = {};

  if (fs.existsSync(solutionDir)) {
    for (const file of fs.readdirSync(solutionDir)) {
      const filePath = path.join(solutionDir, file);
      if (fs.statSync(filePath).isFile()) {
        const lang = langKeyFromFile(file);
        solution[lang] = fs.readFileSync(filePath, 'utf-8');
      }
    }
  }

  // --- 3. Normalise test cases ---
  // The judge uses `Object.values(input)`, so `input` must be an object, not a string.
  // `output` is what the judge compares against (stored as the canonical field name).
  // `isHidden` chọn cột lưu — sample (public, dùng cho "Run") vs hidden
  // (chỉ dùng khi "Submit", không bao giờ trả về client).
  const sampleTestCases = rawTests
    .filter((t) => !t.isHidden)
    .map((t) => ({ input: parseInput(t.input), output: t.expected }));
  const hiddenTestCases = rawTests
    .filter((t) => t.isHidden)
    .map((t) => ({ input: parseInput(t.input), output: t.expected }));

  if (sampleTestCases.length === 0) {
    console.warn(
      `  ⚠️  "${folderName}" không có testcase sample nào (isHidden: false) — nút "Run" sẽ không chạy được cho bài này.`,
    );
  }

  // --- 4. Ensure tags exist (upsert) ---
  const tagIds: string[] = [];
  for (const tagName of meta.tags ?? []) {
    const tag = await prisma.tag.upsert({
      where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
      update: { name: tagName },
      create: {
        name: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, '-'),
      },
    });
    tagIds.push(tag.id);
  }

  // --- 5. Create or update the problem ---
  // NOTE: intentionally NOT using prisma.problem.upsert() here. On Postgres,
  // upsert compiles to a single `INSERT ... ON CONFLICT DO UPDATE`, which
  // evaluates the `displayId` column's `DEFAULT nextval(...)` to build the
  // candidate insert row even when the conflict/update branch is taken —
  // permanently burning a sequence value on every re-sync of an unchanged
  // problem. Since this script re-processes every folder on each run, that
  // silently fragmented displayId into large, meaningless gaps. Doing an
  // explicit findUnique + update/create avoids evaluating that DEFAULT
  // unless a row is actually being created.
  const difficulty = meta.difficulty as Difficulty;

  const data = {
    title: meta.title,
    difficulty,
    content,
    initialCode: initialCode as unknown as Prisma.InputJsonValue,
    ...(Object.keys(solution).length > 0
      ? { solution: solution as unknown as Prisma.InputJsonValue }
      : {}),
    sampleTestCases: sampleTestCases as unknown as Prisma.InputJsonValue,
    hiddenTestCases: hiddenTestCases as unknown as Prisma.InputJsonValue,
    functionName: meta.functionName ?? folderName,
    timeLimitMs: meta.timeLimit ?? 1000,
    memoryLimitMb: meta.memoryLimit ?? 256,
  };

  const existing = await prisma.problem.findUnique({
    where: { slug: folderName },
  });

  const problem = existing
    ? await prisma.problem.update({ where: { slug: folderName }, data })
    : await prisma.problem.create({ data: { slug: folderName, ...data } });

  // --- 6. Sync tags (delete old links, re-insert) ---
  await prisma.problemTag.deleteMany({ where: { problemId: problem.id } });
  if (tagIds.length > 0) {
    await prisma.problemTag.createMany({
      data: tagIds.map((tagId) => ({ problemId: problem.id, tagId })),
      skipDuplicates: true,
    });
  }

  console.log(
    `  ✅  "${folderName}" synced (${sampleTestCases.length} sample + ${hiddenTestCases.length} hidden test cases, ${Object.keys(initialCode).length} templates` +
      (Object.keys(solution).length > 0
        ? `, oracle solution: ${Object.keys(solution).join(', ')})`
        : ', no oracle solution)'),
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const problemsDir = path.join(__dirname, 'problems');

  if (!fs.existsSync(problemsDir)) {
    console.error(`❌  problems/ directory not found at ${problemsDir}`);
    process.exit(1);
  }

  const entries = fs
    .readdirSync(problemsDir)
    .filter((name) => fs.statSync(path.join(problemsDir, name)).isDirectory());

  console.log(`🔄  Syncing ${entries.length} problem(s) from ${problemsDir}\n`);

  for (const folderName of entries) {
    await syncProblem(folderName, problemsDir);
  }

  console.log('\n🌱  Sync complete.');
}

main()
  .catch((err) => {
    console.error('❌  Sync failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
