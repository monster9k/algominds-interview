/**
 * seed-quest.ts
 *
 * Standalone seeder for the Quest "Bug Whacker" question bank, following the
 * same "separate script, not prisma/seed.ts" pattern as sync-problems.ts —
 * this is content data meant to be re-run manually when adding more
 * snippets, not part of the one-shot `prisma db seed` flow.
 *
 * Each snippet's buggy line is marked inline with a `__BUG__` comment
 * (`// __BUG__` for JS/Java, `# __BUG__` for Python) instead of a hand-counted
 * line number — the script derives `buggyLine` from the marker's position and
 * strips it before storing `code`, so the stored snippet never shows the tell.
 *
 * Usage:
 *   npx ts-node seed-quest.ts
 *
 * Idempotent: re-running skips any snippet whose exact `code` already exists.
 */

import { PrismaClient, Difficulty, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type Language = 'javascript' | 'python' | 'java';

const MARKERS: Record<Language, string> = {
  javascript: '// __BUG__',
  python: '# __BUG__',
  java: '// __BUG__',
};

interface RawSnippet {
  language: Language;
  difficulty: Difficulty;
  explanation: string;
  /** Multi-line source with the buggy line tagged by the language's marker comment. */
  raw: string;
}

function extractBuggyLine(snippet: RawSnippet): {
  code: string;
  buggyLine: number;
} {
  const marker = MARKERS[snippet.language];
  const lines = snippet.raw.replace(/^\n/, '').replace(/\n$/, '').split('\n');
  const buggyLine = lines.findIndex((line) => line.includes(marker));

  if (buggyLine === -1) {
    throw new Error(
      `No "${marker}" marker found in a ${snippet.language} snippet starting with: ${lines[0]}`,
    );
  }

  lines[buggyLine] = lines[buggyLine].replace(marker, '').trimEnd();
  return { code: lines.join('\n'), buggyLine };
}

// ---------------------------------------------------------------------------
// Snippets — 10 problems x 3 difficulties x 3 languages = 90 total.
// Same conceptual bugs per difficulty tier are ported across languages so
// the bank stays easy to audit and extend.
// ---------------------------------------------------------------------------

const SNIPPETS: RawSnippet[] = [
  // ===== EASY =====
  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      'Off-by-one: `i <= arr.length` reads one past the end, so `arr[arr.length]` (undefined) gets added to the total.',
    raw: `
function sum(arr) {
  let total = 0;
  for (let i = 0; i <= arr.length; i++) { // __BUG__
    total += arr[i];
  }
  return total;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      'Checks for odd (`% 2 == 1`) instead of even, so it returns the opposite of what the function name promises.',
    raw: `
function isEven(n) {
  return n % 2 == 1; // __BUG__
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      "Initializing the running max to 0 gives the wrong answer whenever every element is negative — it should start from the array's first element.",
    raw: `
function findMax(arr) {
  let max = 0; // __BUG__
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      'The loop walks the string forward instead of backward, so it just rebuilds the original string instead of reversing it.',
    raw: `
function reverseString(str) {
  let result = "";
  for (let i = 0; i < str.length; i++) { // __BUG__
    result += str[i];
  }
  return result;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      "Doesn't lowercase the character before checking it against the vowel set, so uppercase vowels like 'A' are never counted.",
    raw: `
function countVowels(str) {
  const vowels = "aeiou";
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (vowels.includes(str[i])) count++; // __BUG__
  }
  return count;
}
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      'range(len(nums) + 1) iterates one index past the end of the list, causing an IndexError.',
    raw: `
def sum_list(nums):
    total = 0
    for i in range(len(nums) + 1):  # __BUG__
        total += nums[i]
    return total
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      "Compares the original (un-lowered) `s` against the reversed cleaned string instead of comparing `cleaned` to its own reverse, so mixed-case palindromes like 'Racecar' are wrongly reported as not palindromes.",
    raw: `
def is_palindrome(s):
    cleaned = s.lower()
    return s == cleaned[::-1]  # __BUG__
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      'Initializing max_val to 0 gives the wrong answer whenever every element in nums is negative; it should start from nums[0].',
    raw: `
def find_max(nums):
    max_val = 0  # __BUG__
    for n in nums:
        if n > max_val:
            max_val = n
    return max_val
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      'text.split(" ") only splits on single spaces, so consecutive spaces produce empty-string entries and inflate the word count; plain .split() handles any whitespace run correctly.',
    raw: `
def count_words(text):
    words = text.split(" ")  # __BUG__
    return len(words)
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      'The trailing `- 1` subtracts one from the correct average for no reason.',
    raw: `
def average(nums):
    total = 0
    for n in nums:
        total += n
    return total / len(nums) - 1  # __BUG__
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      'Off-by-one: `i <= arr.length` reads one past the end, throwing ArrayIndexOutOfBoundsException.',
    raw: `
public int sum(int[] arr) {
    int total = 0;
    for (int i = 0; i <= arr.length; i++) { // __BUG__
        total += arr[i];
    }
    return total;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      'Checks for odd (`% 2 == 1`) instead of even, so it returns the opposite of what the method name promises.',
    raw: `
public boolean isEven(int n) {
    return n % 2 == 1; // __BUG__
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      "Initializing max to 0 gives the wrong answer whenever every element is negative — it should start from the array's first element.",
    raw: `
public int findMax(int[] arr) {
    int max = 0; // __BUG__
    for (int n : arr) {
        if (n > max) max = n;
    }
    return max;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      'The loop walks the string forward instead of backward, so it just rebuilds the original string instead of reversing it.',
    raw: `
public String reverse(String s) {
    StringBuilder result = new StringBuilder();
    for (int i = 0; i < s.length(); i++) { // __BUG__
        result.append(s.charAt(i));
    }
    return result.toString();
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      "Doesn't lowercase the character before checking it against the vowel set, so uppercase vowels are never counted.",
    raw: `
public int countVowels(String s) {
    String vowels = "aeiou";
    int count = 0;
    for (int i = 0; i < s.length(); i++) {
        if (vowels.indexOf(s.charAt(i)) >= 0) count++; // __BUG__
    }
    return count;
}
`,
  },

  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      'The multiplicative identity should be 1, not 0 — starting at 0 makes the loop multiply everything by zero, so the function always returns 0.',
    raw: `
function factorial(n) {
  let result = 0; // __BUG__
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return result;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      'Starting the divisor check at 1 means n % 1 is always 0, so the function returns false for every n — it should start at 2.',
    raw: `
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 1; i < n; i++) { // __BUG__
    if (n % i === 0) return false;
  }
  return true;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      'This returns true when there are NO duplicates (sizes match) — the condition is inverted; it should return true when seen.size is less than arr.length.',
    raw: `
function containsDuplicate(arr) {
  const seen = new Set(arr);
  return seen.size === arr.length; // __BUG__
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      'Comparing against toLowerCase() counts lowercase (and non-letter) characters instead of uppercase ones — it should compare against toUpperCase().',
    raw: `
function countUppercase(str) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === str[i].toLowerCase()) count++; // __BUG__
  }
  return count;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.EASY,
    explanation:
      'slice(0) returns the whole string again, so the first letter gets duplicated — it should be slice(1) to skip the character already capitalized.',
    raw: `
function capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(0); // __BUG__
}
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      'The multiplicative identity should be 1, not 0 — starting at 0 makes the loop multiply everything by zero, so the function always returns 0.',
    raw: `
def factorial(n):
    result = 0  # __BUG__
    for i in range(1, n + 1):
        result *= i
    return result
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      'Starting the divisor check at 1 means n % 1 is always 0, so the function returns False for every n — it should start at 2.',
    raw: `
def is_prime(n):
    if n < 2:
        return False
    for i in range(1, n):  # __BUG__
        if n % i == 0:
            return False
    return True
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      'This returns True when there are NO duplicates (sizes match) — the condition is inverted; it should return True when len(seen) is less than len(nums).',
    raw: `
def contains_duplicate(nums):
    seen = set(nums)
    return len(seen) == len(nums)  # __BUG__
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      'Comparing against ch.lower() counts lowercase (and non-letter) characters instead of uppercase ones — it should compare against ch.upper().',
    raw: `
def count_uppercase(s):
    count = 0
    for ch in s:
        if ch == ch.lower():  # __BUG__
            count += 1
    return count
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.EASY,
    explanation:
      's[0:] returns the whole string again, so the first letter gets duplicated — it should be s[1:] to skip the character already capitalized.',
    raw: `
def capitalize_first_letter(s):
    return s[0].upper() + s[0:]  # __BUG__
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      'The multiplicative identity should be 1, not 0 — starting at 0 makes the loop multiply everything by zero, so the method always returns 0.',
    raw: `
public int factorial(int n) {
    int result = 0; // __BUG__
    for (int i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      'Starting the divisor check at 1 means n % 1 is always 0, so the method returns false for every n — it should start at 2.',
    raw: `
public boolean isPrime(int n) {
    if (n < 2) return false;
    for (int i = 1; i < n; i++) { // __BUG__
        if (n % i == 0) return false;
    }
    return true;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      'This returns true when there are NO duplicates (sizes match) — the condition is inverted; it should return true when seen.size() is less than nums.length.',
    raw: `
public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int n : nums) seen.add(n);
    return seen.size() == nums.length; // __BUG__
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      'Checking isLowerCase counts lowercase (and non-letter) characters instead of uppercase ones — it should check isUpperCase.',
    raw: `
public int countUppercase(String s) {
    int count = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (Character.isLowerCase(c)) count++; // __BUG__
    }
    return count;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.EASY,
    explanation:
      'substring(0) returns the whole string again, so the first letter gets duplicated — it should be substring(1) to skip the character already capitalized.',
    raw: `
public String capitalizeFirstLetter(String s) {
    return Character.toUpperCase(s.charAt(0)) + s.substring(0); // __BUG__
}
`,
  },

  // ===== MEDIUM =====
  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Using `<` instead of `<=` in the loop condition skips the final case where lo and hi meet at a single remaining index, so a target sitting exactly there is missed.',
    raw: `
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo < hi) { // __BUG__
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'The base case returns 1 for any n <= 2, including n = 0, but fib(0) should be 0.',
    raw: `
function fib(n) {
  if (n <= 2) return 1; // __BUG__
  return fib(n - 1) + fib(n - 2);
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      "The else branch pushes a[i] again instead of b[j], duplicating a's current element and never actually consuming from b.",
    raw: `
function mergeSorted(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) {
      result.push(a[i]);
      i++;
    } else {
      result.push(a[i]); // __BUG__
      j++;
    }
  }
  return result.concat(a.slice(i)).concat(b.slice(j));
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      "When item is itself an array it should be spread (result.push(...item)), but this pushes the whole sub-array as a single element, so the result isn't actually flattened.",
    raw: `
function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(item); // __BUG__
    } else {
      result.push(item);
    }
  }
  return result;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Returns the current index twice instead of pairing it with the earlier matching index, so the result never points at the two elements that actually sum to target.',
    raw: `
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [i, i]; // __BUG__
    }
    seen.set(nums[i], i);
  }
  return [];
}
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Should be `lo <= hi`; with `<` the search space collapses to a single element (lo == hi) that never gets checked, so a target sitting exactly there is missed.',
    raw: `
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo < hi:  # __BUG__
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'The tuple assignment order is swapped (`b, a = b, a + b`); this leaves b stuck at its initial value forever while a just grows by a fixed increment, instead of computing the real Fibonacci sequence.',
    raw: `
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        b, a = b, a + b  # __BUG__
    return a
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      "The else branch appends a[i] again instead of b[j], duplicating a's current element and never consuming from b.",
    raw: `
def merge_sorted(a, b):
    result = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] < b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(a[i])  # __BUG__
            j += 1
    result.extend(a[i:])
    result.extend(b[j:])
    return result
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'When item is itself a list it should be extended into result (result.extend(item)), but append() nests the whole sub-list as one element instead of flattening it.',
    raw: `
def flatten(items):
    result = []
    for item in items:
        if isinstance(item, list):
            result.append(item)  # __BUG__
        else:
            result.append(item)
    return result
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Returns the current index twice instead of pairing it with the earlier matching index (seen[complement]), so the result never actually points at the two numbers that sum to target.',
    raw: `
def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [i, i]  # __BUG__
        seen[n] = i
    return []
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Using `<` instead of `<=` in the loop condition skips the final case where lo and hi meet at a single remaining index, so a target sitting exactly there is missed.',
    raw: `
public int binarySearch(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    while (lo < hi) { // __BUG__
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'The base case returns 1 for any n <= 2, including n = 0, but fib(0) should be 0.',
    raw: `
public int fib(int n) {
    if (n <= 2) return 1; // __BUG__
    return fib(n - 1) + fib(n - 2);
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      "The else branch consumes a[i] again instead of b[j], duplicating a's current element and never actually consuming from b.",
    raw: `
public int[] mergeSorted(int[] a, int[] b) {
    int[] result = new int[a.length + b.length];
    int i = 0, j = 0, k = 0;
    while (i < a.length && j < b.length) {
        if (a[i] < b[j]) {
            result[k++] = a[i++];
        } else {
            result[k++] = a[i++]; // __BUG__
        }
    }
    while (i < a.length) result[k++] = a[i++];
    while (j < b.length) result[k++] = b[j++];
    return result;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'When item is itself a List it should be flattened via addAll(item), but add() nests the whole sub-list as one element instead of flattening it.',
    raw: `
public List<Object> flatten(List<Object> items) {
    List<Object> result = new ArrayList<>();
    for (Object item : items) {
        if (item instanceof List) {
            result.add(item); // __BUG__
        } else {
            result.add(item);
        }
    }
    return result;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Returns the current index twice instead of pairing it with the earlier matching index, so the result never points at the two elements that actually sum to target.',
    raw: `
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[] { i, i }; // __BUG__
        }
        seen.put(nums[i], i);
    }
    return new int[0];
}
`,
  },

  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Closing brackets should pop the stack and check they match the corresponding opening bracket — pushing them instead means the stack never shrinks, so this only returns true for an empty string.',
    raw: `
function isBalanced(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const char of s) {
    if (char in pairs) {
      stack.push(char); // __BUG__
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'currentSum should reset to nums[i] whenever the running sum drops below it (Math.max(nums[i], currentSum + nums[i])) — without that, one very negative prefix drags every future sum down instead of starting fresh.',
    raw: `
function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = currentSum + nums[i]; // __BUG__
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'This copies an element forward only when it EQUALS the previous one, keeping duplicates and dropping new values — the condition should be nums[i] !== nums[i - 1].',
    raw: `
function removeDuplicates(nums) {
  let write = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1]) { // __BUG__
      nums[write] = nums[i];
      write++;
    }
  }
  return write;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Only `a` gets sorted before comparing — `b` needs the same split/sort/join treatment too, otherwise this only matches when b happens to already be sorted.',
    raw: `
function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  return a.split("").sort().join("") === b; // __BUG__
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.MEDIUM,
    explanation:
      "k isn't bounded to the array length — when k > n this produces a wrong (or empty) slice; it should use k % n.",
    raw: `
function rotateRight(arr, k) {
  const n = arr.length;
  const shift = k; // __BUG__
  return arr.slice(-shift).concat(arr.slice(0, n - shift));
}
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Closing brackets should pop the stack and check they match the corresponding opening bracket — appending them instead means the stack never shrinks, so this only returns True for an empty string.',
    raw: `
def is_balanced(s):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for char in s:
        if char in pairs:
            stack.append(char)  # __BUG__
        else:
            stack.append(char)
    return len(stack) == 0
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'current_sum should reset to n whenever the running sum drops below it (max(n, current_sum + n)) — without that, one very negative prefix drags every future sum down instead of starting fresh.',
    raw: `
def max_sub_array(nums):
    max_sum = nums[0]
    current_sum = nums[0]
    for n in nums[1:]:
        current_sum = current_sum + n  # __BUG__
        max_sum = max(max_sum, current_sum)
    return max_sum
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'This copies an element forward only when it EQUALS the previous one, keeping duplicates and dropping new values — the condition should be nums[i] != nums[i - 1].',
    raw: `
def remove_duplicates(nums):
    write = 1
    for i in range(1, len(nums)):
        if nums[i] == nums[i - 1]:  # __BUG__
            nums[write] = nums[i]
            write += 1
    return write
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Only `a` gets sorted before comparing — `b` needs the same sorted()/join treatment too, otherwise this only matches when b happens to already be sorted.',
    raw: `
def is_anagram(a, b):
    if len(a) != len(b):
        return False
    return "".join(sorted(a)) == b  # __BUG__
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.MEDIUM,
    explanation:
      "k isn't bounded to the array length — when k > n this produces a wrong (or empty) slice; it should use k % n.",
    raw: `
def rotate_right(arr, k):
    n = len(arr)
    shift = k  # __BUG__
    return arr[-shift:] + arr[:n - shift]
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Closing brackets should pop the stack and check they match the corresponding opening bracket — pushing them instead means the stack never shrinks, so this only returns true for an empty string.',
    raw: `
public boolean isBalanced(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
    for (char c : s.toCharArray()) {
        if (pairs.containsKey(c)) {
            stack.push(c); // __BUG__
        } else {
            stack.push(c);
        }
    }
    return stack.isEmpty();
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'currentSum should reset to nums[i] whenever the running sum drops below it (Math.max(nums[i], currentSum + nums[i])) — without that, one very negative prefix drags every future sum down instead of starting fresh.',
    raw: `
public int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currentSum = currentSum + nums[i]; // __BUG__
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'This copies an element forward only when it EQUALS the previous one, keeping duplicates and dropping new values — the condition should be nums[i] != nums[i - 1].',
    raw: `
public int removeDuplicates(int[] nums) {
    int write = 1;
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] == nums[i - 1]) { // __BUG__
            nums[write] = nums[i];
            write++;
        }
    }
    return write;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      'Only `a` gets sorted before comparing — `b` needs the same char-array-sort treatment too, otherwise this only matches when b happens to already be sorted.',
    raw: `
public boolean isAnagram(String a, String b) {
    if (a.length() != b.length()) return false;
    char[] aChars = a.toCharArray();
    Arrays.sort(aChars);
    return new String(aChars).equals(b); // __BUG__
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.MEDIUM,
    explanation:
      "k isn't bounded to the array length — when k > n this indexes out of bounds; it should use k % n.",
    raw: `
public int[] rotateRight(int[] arr, int k) {
    int n = arr.length;
    int shift = k; // __BUG__
    int[] result = new int[n];
    for (int i = 0; i < n; i++) {
        result[(i + shift) % n] = arr[i];
    }
    return result;
}
`,
  },

  // ===== HARD =====
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      'The pivot swap should use i + 1 (the first element greater than pivot), not i — swapping at i overwrites the last element known to be smaller than pivot and returns the wrong partition index.',
    raw: `
function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i], arr[high]] = [arr[high], arr[i]]; // __BUG__
  return i;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      "get reads the value but never re-inserts the key, so the Map's insertion order (used as recency) never updates on read — the cache can evict entries that were just accessed.",
    raw: `
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    return this.map.get(key); // __BUG__
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      "Fast should advance two nodes per iteration (fast.next.next); advancing only one makes it move at the same speed as slow, so they always meet immediately and the function reports a cycle even when there isn't one.",
    raw: `
function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next; // __BUG__
    if (slow === fast) return true;
  }
  return false;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      'Using `<` instead of `<=` fails to merge intervals that just touch, like [1,3] and [3,5], leaving them as separate ranges.',
    raw: `
function mergeIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    const curr = intervals[i];
    if (curr[0] < last[1]) { // __BUG__
      last[1] = Math.max(last[1], curr[1]);
    } else {
      result.push(curr);
    }
  }
  return result;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      "Should decrement the neighbor's in-degree (- 1) before checking it, but sets it to the same value, so in-degree never reaches 0 for downstream nodes and they're silently dropped from the output order.",
    raw: `
function topoSort(nodes, edges) {
  const inDegree = new Map(nodes.map((n) => [n, 0]));
  const adj = new Map(nodes.map((n) => [n, []]));
  for (const [u, v] of edges) {
    adj.get(u).push(v);
    inDegree.set(v, inDegree.get(v) + 1);
  }
  const queue = nodes.filter((n) => inDegree.get(n) === 0);
  const order = [];
  while (queue.length) {
    const n = queue.shift();
    order.push(n);
    for (const neighbor of adj.get(n)) {
      inDegree.set(neighbor, inDegree.get(neighbor)); // __BUG__
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);
    }
  }
  return order;
}
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      'The pivot swap should target i + 1 (the first slot known to be >= pivot), not i — swapping at i overwrites an element already confirmed smaller than pivot and returns the wrong partition index.',
    raw: `
def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i], arr[high] = arr[high], arr[i]  # __BUG__
    return i
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      "get returns the value but never calls move_to_end, so the OrderedDict's recency order never updates on read — the cache can evict entries that were just accessed.",
    raw: `
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        return self.cache[key]  # __BUG__

    def put(self, key, value):
        if key in self.cache:
            del self.cache[key]
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      "Fast should advance two nodes per iteration; advancing only one makes it move at the same speed as slow, so they always meet immediately and the function reports a cycle even when there isn't one.",
    raw: `
def has_cycle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next  # __BUG__
        if slow is fast:
            return True
    return False
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      'Using strict `<` instead of `<=` fails to merge intervals that just touch, like [1,3] and [3,5], leaving them as separate ranges.',
    raw: `
def merge_intervals(intervals):
    intervals.sort(key=lambda x: x[0])
    result = [intervals[0]]
    for curr in intervals[1:]:
        last = result[-1]
        if curr[0] < last[1]:  # __BUG__
            last[1] = max(last[1], curr[1])
        else:
            result.append(curr)
    return result
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      "Should decrement the neighbor's in-degree by 1 before checking it, but sets it to the same value, so in-degree never reaches 0 for downstream nodes and they're silently dropped from the output.",
    raw: `
def topo_sort(nodes, edges):
    in_degree = {n: 0 for n in nodes}
    adj = {n: [] for n in nodes}
    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1
    queue = [n for n in nodes if in_degree[n] == 0]
    order = []
    while queue:
        n = queue.pop(0)
        order.append(n)
        for neighbor in adj[n]:
            in_degree[neighbor] = in_degree[neighbor]  # __BUG__
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    return order
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      'The pivot swap should target i + 1 (the first slot known to be >= pivot), not i — swapping at i overwrites an element already confirmed smaller than pivot and returns the wrong partition index.',
    raw: `
public int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
    }
    int tmp = arr[i]; arr[i] = arr[high]; arr[high] = tmp; // __BUG__
    return i;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      "get returns the value but never re-inserts the key, so the LinkedHashMap's recency order never updates on read — the cache can evict entries that were just accessed.",
    raw: `
class LRUCache {
    private final int capacity;
    private final LinkedHashMap<Integer, Integer> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>();
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        return map.get(key); // __BUG__
    }

    public void put(int key, int value) {
        map.remove(key);
        map.put(key, value);
        if (map.size() > capacity) {
            int oldestKey = map.keySet().iterator().next();
            map.remove(oldestKey);
        }
    }
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      "Fast should advance two nodes per iteration; advancing only one makes it move at the same speed as slow, so they always meet immediately and the method reports a cycle even when there isn't one.",
    raw: `
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next; // __BUG__
        if (slow == fast) return true;
    }
    return false;
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      'Using strict `<` instead of `<=` fails to merge intervals that just touch, like [1,3] and [3,5], leaving them as separate ranges.',
    raw: `
public int[][] mergeIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> result = new ArrayList<>();
    result.add(intervals[0]);
    for (int i = 1; i < intervals.length; i++) {
        int[] last = result.get(result.size() - 1);
        int[] curr = intervals[i];
        if (curr[0] < last[1]) { // __BUG__
            last[1] = Math.max(last[1], curr[1]);
        } else {
            result.add(curr);
        }
    }
    return result.toArray(new int[0][]);
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      "Should decrement the neighbor's in-degree before checking it, but sets it to the same value, so in-degree never reaches 0 for downstream nodes and they're silently dropped from the output order.",
    raw: `
public List<String> topoSort(List<String> nodes, Map<String, List<String>> adj, Map<String, Integer> inDegree) {
    Queue<String> queue = new LinkedList<>();
    for (String n : nodes) {
        if (inDegree.get(n) == 0) queue.add(n);
    }
    List<String> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        String n = queue.poll();
        order.add(n);
        for (String neighbor : adj.get(n)) {
            inDegree.put(neighbor, inDegree.get(neighbor)); // __BUG__
            if (inDegree.get(neighbor) == 0) queue.add(neighbor);
        }
    }
    return order;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      'When characters match, the length should extend by 1 over the diagonal (dp[i-1][j-1] + 1) — without the +1, matching characters never actually grow the subsequence.',
    raw: `
function longestCommonSubsequence(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // __BUG__
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      'Filling dp with 0 makes every amount look already reachable with zero coins, so Math.min never updates — unreachable amounts should start at Infinity, with only dp[0] = 0.',
    raw: `
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(0); // __BUG__
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      "The outer scan should trigger a new island on '1' (land), not '0' (water) — with the condition inverted, it counts water cells and DFS immediately returns without sinking any land.",
    raw: `
function numIslands(grid) {
  let count = 0;
  const rows = grid.length, cols = grid[0].length;
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] === '0') return;
    grid[r][c] = '0';
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '0') { // __BUG__
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      'dp[0] represents the empty prefix, which is always breakable — it must be true; setting it to false means no word starting at index 0 can ever be matched.',
    raw: `
function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = false; // __BUG__
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}
`,
  },
  {
    language: 'javascript',
    difficulty: Difficulty.HARD,
    explanation:
      'This overwrites dp[i] with every qualifying j instead of keeping the best one — it should be dp[i] = Math.max(dp[i], dp[j] + 1), otherwise a later, shorter chain can clobber a longer one already found.',
    raw: `
function lengthOfLIS(nums) {
  const dp = new Array(nums.length).fill(1);
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = dp[j] + 1; // __BUG__
      }
    }
  }
  return Math.max(...dp);
}
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      'When characters match, the length should extend by 1 over the diagonal (dp[i-1][j-1] + 1) — without the +1, matching characters never actually grow the subsequence.',
    raw: `
def longest_common_subsequence(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]  # __BUG__
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[len(a)][len(b)]
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      'Filling dp with 0 makes every amount look already reachable with zero coins, so min() never updates — unreachable amounts should start at infinity, with only dp[0] = 0.',
    raw: `
def coin_change(coins, amount):
    dp = [0] * (amount + 1)  # __BUG__
    dp[0] = 0
    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      "The outer scan should trigger a new island on '1' (land), not '0' (water) — with the condition inverted, it counts water cells and dfs immediately returns without sinking any land.",
    raw: `
def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    count = 0

    def dfs(r, c):
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] == '0':
            return
        grid[r][c] = '0'
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '0':  # __BUG__
                count += 1
                dfs(r, c)
    return count
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      'dp[0] represents the empty prefix, which is always breakable — it must be True; setting it to False means no word starting at index 0 can ever be matched.',
    raw: `
def word_break(s, word_dict):
    words = set(word_dict)
    dp = [False] * (len(s) + 1)
    dp[0] = False  # __BUG__
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[len(s)]
`,
  },
  {
    language: 'python',
    difficulty: Difficulty.HARD,
    explanation:
      'This overwrites dp[i] with every qualifying j instead of keeping the best one — it should be max(dp[i], dp[j] + 1), otherwise a later, shorter chain can clobber a longer one already found.',
    raw: `
def length_of_lis(nums):
    dp = [1] * len(nums)
    for i in range(1, len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = dp[j] + 1  # __BUG__
    return max(dp)
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      'When characters match, the length should extend by 1 over the diagonal (dp[i-1][j-1] + 1) — without the +1, matching characters never actually grow the subsequence.',
    raw: `
public int longestCommonSubsequence(String a, String b) {
    int[][] dp = new int[a.length() + 1][b.length() + 1];
    for (int i = 1; i <= a.length(); i++) {
        for (int j = 1; j <= b.length(); j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1]; // __BUG__
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[a.length()][b.length()];
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      'Filling dp with 0 makes every amount look already reachable with zero coins, so Math.min never updates — unreachable amounts should start at a large sentinel, with only dp[0] = 0.',
    raw: `
public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, 0); // __BUG__
    dp[0] = 0;
    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] >= amount + 1 ? -1 : dp[amount];
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      "The outer scan should trigger a new island on '1' (land), not '0' (water) — with the condition inverted, it counts water cells and dfs immediately returns without sinking any land.",
    raw: `
public int numIslands(char[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    int count = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '0') { // __BUG__
                count++;
                dfs(grid, r, c, rows, cols);
            }
        }
    }
    return count;
}

private void dfs(char[][] grid, int r, int c, int rows, int cols) {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] == '0') return;
    grid[r][c] = '0';
    dfs(grid, r + 1, c, rows, cols);
    dfs(grid, r - 1, c, rows, cols);
    dfs(grid, r, c + 1, rows, cols);
    dfs(grid, r, c - 1, rows, cols);
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      'dp[0] represents the empty prefix, which is always breakable — it must be true; setting it to false means no word starting at index 0 can ever be matched.',
    raw: `
public boolean wordBreak(String s, List<String> wordDict) {
    Set<String> words = new HashSet<>(wordDict);
    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = false; // __BUG__
    for (int i = 1; i <= s.length(); i++) {
        for (int j = 0; j < i; j++) {
            if (dp[j] && words.contains(s.substring(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[s.length()];
}
`,
  },
  {
    language: 'java',
    difficulty: Difficulty.HARD,
    explanation:
      'This overwrites dp[i] with every qualifying j instead of keeping the best one — it should be Math.max(dp[i], dp[j] + 1), otherwise a later, shorter chain can clobber a longer one already found.',
    raw: `
public int lengthOfLIS(int[] nums) {
    int[] dp = new int[nums.length];
    Arrays.fill(dp, 1);
    for (int i = 1; i < nums.length; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = dp[j] + 1; // __BUG__
            }
        }
    }
    int max = 0;
    for (int v : dp) max = Math.max(max, v);
    return max;
}
`,
  },
];

async function main() {
  console.log(`🔄  Seeding ${SNIPPETS.length} quest snippet(s)...`);
  let created = 0;
  let skipped = 0;

  for (const snippet of SNIPPETS) {
    const { code, buggyLine } = extractBuggyLine(snippet);

    const existing = await prisma.bugSnippet.findFirst({ where: { code } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.bugSnippet.create({
      data: {
        language: snippet.language,
        difficulty: snippet.difficulty,
        code,
        buggyLine,
        explanation: snippet.explanation,
      } satisfies Prisma.BugSnippetCreateInput,
    });
    created++;
  }

  console.log(
    `✅  Done — ${created} created, ${skipped} already present (skipped).`,
  );
}

main()
  .catch((err) => {
    console.error('❌  Quest seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
