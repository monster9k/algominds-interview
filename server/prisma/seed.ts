import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // ===============================
  // BÀI 1: VALID PARENTHESES
  // ===============================
  await prisma.problem.upsert({
    where: { slug: 'valid-parentheses' },
    update: {},
    create: {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      difficulty: Difficulty.EASY,
      functionName: 'isValid',
      content: `
        <p>Given a string <code>s</code> containing just the characters
        <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>,
        <code>'['</code>, <code>']'</code>, determine if the input string is valid.</p>
      `,
      timeLimitMs: 1000,
      memoryLimitMb: 256,

      initialCode: {
        javascript: `function isValid(s) {
  // Write your code here
};`,
        typescript: `function isValid(s: string): boolean {
  // Write your code here
}`,
        cpp: `class Solution {
public:
    bool isValid(string s) {
        // Write your code here
    }
};`,
      },

      testCases: [
        { input: { s: '()' }, output: true },
        { input: { s: '()[]{}' }, output: true },
        { input: { s: '(]' }, output: false },
        { input: { s: '([)]' }, output: false },
        { input: { s: '{[]}' }, output: true },
      ],

      tags: {
        create: [
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Stack' },
                create: { name: 'Stack', slug: 'stack' },
              },
            },
          },
        ],
      },
    },
  });

  // ===============================
  // BÀI 2: TWO SUM
  // ===============================
  await prisma.problem.upsert({
    where: { slug: 'two-sum' },
    update: {},
    create: {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: Difficulty.EASY,
      functionName: 'twoSum',
      content: `
        <p>Given an array of integers <code>nums</code> and an integer <code>target</code>,
        return indices of the two numbers such that they add up to <code>target</code>.</p>
      `,
      timeLimitMs: 1000,
      memoryLimitMb: 256,

      initialCode: {
        javascript: `function twoSum(nums, target) {
  // Write your code here
};`,
        typescript: `function twoSum(nums: number[], target: number): number[] {
  // Write your code here
}`,
        cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here
    }
};`,
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

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
//npx prisma db seed
