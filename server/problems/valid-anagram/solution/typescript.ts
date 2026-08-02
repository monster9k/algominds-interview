function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const counts: Record<string, number> = {};
  for (const ch of s) counts[ch] = (counts[ch] ?? 0) + 1;
  for (const ch of t) {
    if (!counts[ch]) return false;
    counts[ch]--;
  }
  return true;
}
