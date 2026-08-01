Write an algorithm to determine if a number `n` is happy. A happy number is defined by the following process: starting with any positive integer, replace the number by the sum of the squares of its digits, repeat until the number equals 1 (where it will stay), or it loops endlessly in a cycle that does not include 1. Return `true` if `n` is a happy number, and `false` if not.

**Constraints:**

- `1 <= n <= 2^31 - 1`

**Example 1:**

> **Input:** n = 19
> **Output:** true
> **Explanation:** 1² + 9² = 82, 8² + 2² = 68, 6² + 8² = 100, 1² + 0² + 0² = 1.

**Example 2:**

> **Input:** n = 2
> **Output:** false

**Example 3:**

> **Input:** n = 1
> **Output:** true
