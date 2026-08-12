// Bảng màu cố định xoay vòng theo id tag — tránh bịa màu random, chỉ dùng
// token màu semantic sẵn có trong theme (giống cách contest-card.tsx map màu
// theo status thay vì lưu màu tự do trong DB).
const TAG_COLOR_CLASSES = [
  "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "bg-muted text-muted-foreground border-border",
];

export function getTagColorClass(tagId: string): string {
  let hash = 0;
  for (let i = 0; i < tagId.length; i++) {
    hash = (hash * 31 + tagId.charCodeAt(i)) >>> 0;
  }
  return TAG_COLOR_CLASSES[hash % TAG_COLOR_CLASSES.length];
}
