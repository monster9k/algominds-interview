Given two integers `dividend` and `divisor`, divide two integers without using multiplication, division, and mod operator. The integer division should truncate toward zero, which means losing its fractional part.

**Constraints:**

- `-2^31 <= dividend, divisor <= 2^31 - 1`
- `divisor != 0`

**Example 1:**

> **Input:** dividend = 10, divisor = 3
> **Output:** 3
> **Explanation:** 10/3 = 3.33333.. which is truncated to 3.

**Example 2:**

> **Input:** dividend = 7, divisor = -3
> **Output:** -2
> **Explanation:** 7/-3 = -2.33333.. which is truncated to -2.

**Example 3:**

> **Input:** dividend = 0, divisor = 1
> **Output:** 0
