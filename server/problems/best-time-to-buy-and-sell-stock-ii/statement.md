You are given an integer array `prices` where `prices[i]` is the price of a given stock on the `i`-th day. On each day, you may buy and/or sell the stock — you can hold at most one share at a time, but you may buy it then immediately sell it on the same day. Find and return the maximum profit you can achieve.

**Constraints:**

- `1 <= prices.length <= 3 * 10^4`
- `0 <= prices[i] <= 10^4`

**Example 1:**

> **Input:** prices = [7,1,5,3,6,4]
> **Output:** 7
> **Explanation:** Buy on day 2 (price = 1) and sell on day 3 (price = 5), profit = 4. Then buy on day 4 (price = 3) and sell on day 5 (price = 6), profit = 3. Total profit = 7.

**Example 2:**

> **Input:** prices = [1,2,3,4,5]
> **Output:** 4

**Example 3:**

> **Input:** prices = [7,6,4,3,1]
> **Output:** 0
