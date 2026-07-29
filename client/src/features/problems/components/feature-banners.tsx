import { Sparkles, Boxes, GraduationCap, Trophy } from "lucide-react";

// Banner quảng cáo tĩnh (UI only) mô phỏng dãy thẻ "LeetCode Crash Course" trên trang gốc
const BANNERS = [
  {
    id: "fingertips",
    title: "AlgoMinds at Your Fingertips",
    caption: "Practice anywhere, anytime.",
    icon: Sparkles,
    className: "bg-gradient-to-br from-zinc-800 to-zinc-950 border-zinc-700/50",
    iconClassName: "text-violet-400",
  },
  {
    id: "system-design",
    title: "Interview Crash Course:",
    caption: "System Design and Beyond",
    icon: Boxes,
    className:
      "bg-gradient-to-br from-emerald-700 to-emerald-950 border-emerald-600/30",
    iconClassName: "text-emerald-200",
  },
  {
    id: "dsa",
    title: "Interview Crash Course:",
    caption: "Data Structures and Algorithms",
    icon: GraduationCap,
    className:
      "bg-gradient-to-br from-purple-700 to-purple-950 border-purple-600/30",
    iconClassName: "text-purple-200",
  },
  {
    id: "top-interview",
    title: "Top Interview",
    caption: "Questions",
    icon: Trophy,
    className:
      "bg-gradient-to-br from-blue-600 to-blue-950 border-blue-500/30",
    iconClassName: "text-blue-200",
  },
];

export function FeatureBanners() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {BANNERS.map((banner) => (
        <div
          key={banner.id}
          className={`relative h-28 rounded-xl border p-4 flex flex-col justify-between overflow-hidden cursor-pointer group transition-transform hover:-translate-y-0.5 ${banner.className}`}
        >
          <banner.icon
            className={`h-6 w-6 ${banner.iconClassName} opacity-90`}
          />
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              {banner.title}
            </p>
            <p className="text-xs text-white/70 leading-tight">
              {banner.caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
