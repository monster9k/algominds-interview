Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays. The overall run time complexity should be `O(log (m+n))`.

**Constraints:**

- `nums1.length == m`
- `nums2.length == n`
- `0 <= m <= 1000`
- `0 <= n <= 1000`
- `1 <= m + n <= 2000`

**Example 1:**

> **Input:** nums1 = [1,3], nums2 = [2]
> **Output:** 2.0
> **Explanation:** merged = [1,2,3], median is 2.

**Example 2:**

> **Input:** nums1 = [1,2], nums2 = [3,4]
> **Output:** 2.5
> **Explanation:** merged = [1,2,3,4], median is (2 + 3) / 2 = 2.5.

**Example 3:**

> **Input:** nums1 = [0,0], nums2 = [0,0]
> **Output:** 0.0
