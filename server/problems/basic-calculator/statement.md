Given a string `s` representing a valid expression, implement a basic calculator to evaluate it, and return the result of the evaluation. The expression string may contain open `(` and closing parentheses `)`, the plus `+` or minus sign `-`, non-negative integers, and empty spaces. You are not allowed to use any function that evaluates strings as mathematical expressions.

**Constraints:**

- `1 <= s.length <= 3 * 10^5`
- `s` consists of digits, `'+'`, `'-'`, `'('`, `')'`, and `' '`.
- `s` represents a valid expression.

**Example 1:**

> **Input:** s = "1 + 1"
> **Output:** 2

**Example 2:**

> **Input:** s = " 2-1 + 2 "
> **Output:** 3

**Example 3:**

> **Input:** s = "(1+(4+5+2)-3)+(6+8)"
> **Output:** 23
