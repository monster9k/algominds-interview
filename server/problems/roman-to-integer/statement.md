Roman numerals are represented by the symbols `I`, `V`, `X`, `L`, `C`, `D`, `M`, worth `1`, `5`, `10`, `50`, `100`, `500`, `1000` respectively. Given a roman numeral `s`, convert it to an integer.

**Constraints:**

- `1 <= s.length <= 15`
- `s` contains only the characters `('I', 'V', 'X', 'L', 'C', 'D', 'M')`.
- `s` is guaranteed to be a valid roman numeral in the range `[1, 3999]`.

**Example 1:**

> **Input:** s = "III"
> **Output:** 3

**Example 2:**

> **Input:** s = "LVIII"
> **Output:** 58
> **Explanation:** L = 50, V = 5, III = 3.

**Example 3:**

> **Input:** s = "MCMXCIV"
> **Output:** 1994
> **Explanation:** M = 1000, CM = 900, XC = 90, IV = 4.
