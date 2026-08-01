Given two strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return the empty string `""`.

**Constraints:**

- `1 <= s.length, t.length <= 10^5`
- `s` and `t` consist of uppercase and lowercase English letters.

**Example 1:**

> **Input:** s = "ADOBECODEBANC", t = "ABC"
> **Output:** "BANC"
> **Explanation:** The minimum window substring "BANC" includes 'A', 'B', and 'C' from string t.

**Example 2:**

> **Input:** s = "a", t = "a"
> **Output:** "a"

**Example 3:**

> **Input:** s = "a", t = "aa"
> **Output:** ""
> **Explanation:** Both 'a's from t must be included, but s only has one 'a'.
