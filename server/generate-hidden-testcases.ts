/**
 * generate-hidden-testcases.ts
 *
 * Sinh hàng loạt hidden testcase cho 1 problem bằng cách dùng chính
 * `Problem.solution` (đã có sẵn trong DB, hiện chưa khai thác gì ngoài 1 cờ
 * hasSolution) làm oracle — chạy solution qua Piston cho từng input do admin
 * cung cấp để TỰ TÍNH expected output, thay vì phải viết tay đáp án cho
 * hàng trăm case.
 *
 * Luồng 2 bước, CÓ REVIEW — script này KHÔNG ghi thẳng vào DB:
 *   1. Chuẩn bị `problems/<slug>/hidden-inputs.json` — mảng { input: {...} },
 *      CHỈ input (không có expected). Admin tự nghĩ input: edge case thủ công
 *      (mảng rỗng, số âm, giá trị biên...) + input ngẫu nhiên.
 *   2. Chạy: npx ts-node generate-hidden-testcases.ts <slug> [language]
 *      → ghi ra `problems/<slug>/tests.generated.json` (mảng
 *      { input, expected, isHidden: true }) để admin tự review đáp án đúng
 *      chưa, rồi copy thủ công phần đã duyệt vào `problems/<slug>/tests.json`
 *      và chạy lại `sync-problems.ts` để đưa vào DB.
 *
 * Không ghi thẳng vào hiddenTestCases: nếu solution có bug, sinh thẳng vào DB
 * sẽ âm thầm đầu độc cả bộ test bằng đáp án sai mà không ai phát hiện.
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import { CodeGeneratorService } from './src/modules/judge/services/code-generator.service';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const codeGenerator = new CodeGeneratorService();

// Giữ đồng bộ thủ công với PistonService.getLanguageConfig() — script này
// không dùng NestJS DI nên không tái sử dụng trực tiếp được service đó.
const LANGUAGE_CONFIG: Record<
  string,
  { language: string; version: string; fileName: string }
> = {
  typescript: {
    language: 'typescript',
    version: '5.0.3',
    fileName: 'solution.ts',
  },
  javascript: { language: 'node', version: '20.11.1', fileName: 'solution.js' },
  python: { language: 'python', version: '3.12.0', fileName: 'solution.py' },
  cpp: { language: 'c++', version: '10.2.0', fileName: 'solution.cpp' },
  java: { language: 'java', version: '15.0.2', fileName: 'Main.java' },
};

interface HiddenInput {
  input: Record<string, unknown>;
}

// Minimal shape of Piston's /execute response — mirrors PistonStageResult /
// PistonExecuteResponse in piston.service.ts (kept local, not imported,
// since this script doesn't go through NestJS DI — see LANGUAGE_CONFIG note).
interface PistonStageResult {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number;
}

interface PistonExecuteResponse {
  compile?: PistonStageResult;
  run?: PistonStageResult;
}

async function runOracle(
  language: string,
  code: string,
  stdin: string | undefined,
  limits: { timeLimitMs: number; memoryLimitMb: number },
): Promise<unknown> {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new Error(`Chưa hỗ trợ ngôn ngữ "${language}" trong script này`);
  }

  const pistonApiUrl = process.env.PISTON_API_URL;
  if (!pistonApiUrl) {
    throw new Error('Thiếu PISTON_API_URL trong .env');
  }

  const payload: Record<string, unknown> = {
    language: config.language,
    version: config.version,
    files: [{ name: config.fileName, content: code }],
    run_timeout: limits.timeLimitMs,
    run_memory_limit: limits.memoryLimitMb * 1024 * 1024,
  };
  if (stdin !== undefined) {
    payload.stdin = stdin;
  }
  if (config.language === 'java') {
    payload.main = 'Main';
  }

  const { data } = await axios.post<PistonExecuteResponse>(
    pistonApiUrl,
    payload,
  );
  const run = data?.run;
  const compile = data?.compile;

  if (compile && compile.code !== 0) {
    throw new Error(
      `Solution compile lỗi: ${compile.stderr || compile.output}`,
    );
  }
  if (!run) {
    throw new Error('Piston không trả về run stage nào');
  }
  if (run.code !== 0 && run.stderr) {
    throw new Error(`Solution chạy lỗi: ${run.stderr}`);
  }

  const stdout = (run.stdout ?? '').trim();
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(
      `Không parse được output của solution làm JSON: "${stdout}"`,
    );
  }
}

async function main() {
  const [, , slug, languageArg] = process.argv;
  if (!slug) {
    console.error(
      'Cách dùng: npx ts-node generate-hidden-testcases.ts <slug> [language]',
    );
    process.exit(1);
  }

  const problem = await prisma.problem.findUnique({ where: { slug } });
  if (!problem) {
    console.error(`❌  Không tìm thấy problem "${slug}"`);
    process.exit(1);
  }

  const solutionMap = (problem.solution ?? {}) as Record<string, string>;
  const language = languageArg ?? Object.keys(solutionMap)[0];
  const solutionCode = language ? solutionMap[language] : undefined;

  if (!language || !solutionCode) {
    console.error(
      `❌  Problem "${slug}" chưa có Problem.solution cho ngôn ngữ nào — không có oracle để sinh testcase. Cần bổ sung solution trước.`,
    );
    process.exit(1);
  }

  const problemsDir = path.join(__dirname, 'problems', slug);
  const inputsPath = path.join(problemsDir, 'hidden-inputs.json');
  if (!fs.existsSync(inputsPath)) {
    console.error(`❌  Không tìm thấy ${inputsPath}`);
    process.exit(1);
  }

  const inputs = JSON.parse(
    fs.readFileSync(inputsPath, 'utf-8'),
  ) as HiddenInput[];

  console.log(
    `🔄  Sinh ${inputs.length} hidden testcase cho "${slug}" bằng oracle "${language}"...\n`,
  );

  const generated: Array<{
    input: Record<string, unknown>;
    expected: unknown;
    isHidden: true;
  }> = [];

  for (const [index, { input }] of inputs.entries()) {
    const { code, stdin } = codeGenerator.prepareRunnableCode(
      language,
      solutionCode,
      input,
      problem.functionName,
    );

    try {
      const expected = await runOracle(language, code, stdin, {
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      });
      generated.push({ input, expected, isHidden: true });
      console.log(`  ✅  case ${index + 1}/${inputs.length} OK`);
    } catch (err) {
      console.error(
        `  ⚠️  case ${index + 1}/${inputs.length} lỗi, bỏ qua: ${(err as Error).message}`,
      );
    }
  }

  const outputPath = path.join(problemsDir, 'tests.generated.json');
  fs.writeFileSync(outputPath, JSON.stringify(generated, null, 2), 'utf-8');

  console.log(
    `\n🌱  Đã sinh ${generated.length}/${inputs.length} case vào ${outputPath}.` +
      `\n    Vui lòng REVIEW đáp án trước khi copy vào problems/${slug}/tests.json.`,
  );
}

main()
  .catch((err) => {
    console.error('❌  Sinh testcase thất bại:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
