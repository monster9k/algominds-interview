You are given an array of integers `nums`, and a sliding window of size `k` which moves from the very left of the array to the very right. You can only see the `k` numbers in the window at a time. Each time the sliding window moves right by one position, return the max sliding window.

**Constraints:**

- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`
- `1 <= k <= nums.length`

**Example 1:**

> **Input:** nums = [1,3,-1,-3,5,3,6,7], k = 3
> **Output:** [3,3,5,5,6,7]

**Example 2:**

> **Input:** nums = [1], k = 1
> **Output:** [1]

**Example 3:**

> **Input:** nums = [9,11], k = 2
> **Output:** [11]
