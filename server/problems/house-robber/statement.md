You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, given by the integer array `nums`. Adjacent houses have connected security systems, so you cannot rob two adjacent houses on the same night. Return the maximum amount of money you can rob without alerting the police.

**Constraints:**

- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 400`

**Example 1:**

> **Input:** nums = [1,2,3,1]
> **Output:** 4
> **Explanation:** Rob house 0 (money = 1) and house 2 (money = 3). Total = 4.

**Example 2:**

> **Input:** nums = [2,7,9,3,1]
> **Output:** 12

**Example 3:**

> **Input:** nums = [2,1,1,2]
> **Output:** 4
