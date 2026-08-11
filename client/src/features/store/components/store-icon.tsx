import { Crown, Flame, Sparkles } from "lucide-react";

interface StoreIconProps {
  iconKey: string;
  className?: string;
}

// Chỉ TITLE items dùng iconKey dạng tên icon lucide — AVATAR_FRAME/BADGE_COLOR
// dùng mã màu hex (xem StoreItemCard, phân biệt bằng iconKey.startsWith("#")).
// Switch tường minh (thay vì tra bảng Record<string, LucideIcon> rồi render
// biến đó như JSX tag) vì react-hooks/static-components coi biến component
// chọn động lúc render là "component tạo trong render" dù chỉ là tra cứu.
export function StoreIcon({ iconKey, className }: StoreIconProps) {
  switch (iconKey) {
    case "sparkles":
      return <Sparkles className={className} />;
    case "flame":
      return <Flame className={className} />;
    case "crown":
      return <Crown className={className} />;
    default:
      return null;
  }
}
