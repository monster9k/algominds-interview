Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`. You have the following three operations permitted on a word: insert a character, delete a character, replace a character.

**Constraints:**

- `0 <= word1.length, word2.length <= 500`
- `word1` and `word2` consist of lowercase English letters.

**Example 1:**

> **Input:** word1 = "horse", word2 = "ros"
> **Output:** 3
> **Explanation:** horse -> rorse -> rose -> ros

**Example 2:**

> **Input:** word1 = "intention", word2 = "execution"
> **Output:** 5

**Example 3:**

> **Input:** word1 = "", word2 = "a"
> **Output:** 1
