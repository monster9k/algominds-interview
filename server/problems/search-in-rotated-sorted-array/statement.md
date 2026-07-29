There is an integer array `nums` sorted in ascending order (with distinct values). Prior to being passed to your function, `nums` is possibly rotated at an unknown pivot index.

Given the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.

You must write an algorithm with `O(log n)` runtime complexity.

**Constraints:**

- `1 <= nums.length <= 5000`
- `-10^4 <= nums[i] <= 10^4`
- All values of `nums` are unique.
- `nums` is an ascending array that is possibly rotated.

**Example 1:**

> **Input:** nums = [4,5,6,7,0,1,2], target = 0
> **Output:** 4

**Example 2:**

> **Input:** nums = [4,5,6,7,0,1,2], target = 3
> **Output:** -1
