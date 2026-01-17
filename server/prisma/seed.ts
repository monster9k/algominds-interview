import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Tạo bài Two Sum
  const twoSum = await prisma.problem.upsert({
    where: { slug: 'two-sum' },
    update: {},
    create: {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: Difficulty.EASY,
      content:
        '<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>',
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      initialCode: {
        typescript:
          'function twoSum(nums: number[], target: number): number[] {\n  // Write your code here\n};',
        javascript:
          'function twoSum(nums, target) {\n  // Write your code here\n};',
      },
      testCases: [
        { input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] },
        { input: { nums: [3, 2, 4], target: 6 }, output: [1, 2] },
        { input: { nums: [3, 3], target: 6 }, output: [0, 1] },
      ],
      tags: {
        create: [
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Array' },
                create: { name: 'Array', slug: 'array' },
              },
            },
          },
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Hash Table' },
                create: { name: 'Hash Table', slug: 'hash-table' },
              },
            },
          },
        ],
      },
    },
  });

  console.log(`✅ Created problem: ${twoSum.title}`);
  console.log('🌱 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
