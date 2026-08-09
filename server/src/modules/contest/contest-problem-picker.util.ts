import { Difficulty, Problem } from '@prisma/client';

export interface DifficultyCounts {
  easy: number;
  medium: number;
  hard: number;
}

// Pure function, KHÔNG phụ thuộc Nest DI/Prisma Client — để cả seed script
// (PrismaClient thuần, không có Nest app context) lẫn ContestService (Nest DI)
// dùng chung đúng 1 thuật toán chọn bài random theo độ khó, thay vì mỗi nơi
// tự viết lại.
//
// strict: true (dùng cho API tạo contest) — throw nếu 1 băng độ khó không đủ
// bài, đặt tên rõ băng nào thiếu.
// strict: false (dùng cho seed script) — best-effort, lấy tối đa có thể thay
// vì crash khi DB dev còn ít bài.
export function pickRandomProblemsByDifficulty(
  pool: Problem[],
  wanted: DifficultyCounts,
  options: { strict: boolean } = { strict: true },
): Problem[] {
  const bands: { difficulty: Difficulty; count: number }[] = [
    { difficulty: Difficulty.EASY, count: wanted.easy },
    { difficulty: Difficulty.MEDIUM, count: wanted.medium },
    { difficulty: Difficulty.HARD, count: wanted.hard },
  ];

  const picked: Problem[] = [];
  for (const { difficulty, count } of bands) {
    if (count <= 0) continue;

    const available = shuffle(pool.filter((p) => p.difficulty === difficulty));
    if (options.strict && available.length < count) {
      throw new Error(
        `Chỉ có ${available.length}/${count} bài độ khó ${difficulty} khả dụng`,
      );
    }
    picked.push(...available.slice(0, count));
  }

  return picked;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
