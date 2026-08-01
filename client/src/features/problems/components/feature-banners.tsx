import { Sparkles, Boxes, GraduationCap, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

// Banner quảng cáo tĩnh (UI only) mô phỏng dãy thẻ "LeetCode Crash Course" trên trang gốc
const BANNERS = [
  {
    id: "fingertips",
    titleKey: "banners.fingertips.title",
    captionKey: "banners.fingertips.caption",
    icon: Sparkles,
    className: "bg-gradient-to-br from-muted to-card border-border",
    iconClassName: "text-violet-400",
    titleClassName: "text-foreground",
    captionClassName: "text-muted-foreground",
  },
  {
    id: "system-design",
    titleKey: "banners.systemDesign.title",
    captionKey: "banners.systemDesign.caption",
    icon: Boxes,
    className:
      "bg-gradient-to-br from-emerald-700 to-emerald-950 border-emerald-600/30",
    iconClassName: "text-emerald-200",
    titleClassName: "text-white",
    captionClassName: "text-white/70",
  },
  {
    id: "dsa",
    titleKey: "banners.dsa.title",
    captionKey: "banners.dsa.caption",
    icon: GraduationCap,
    className:
      "bg-gradient-to-br from-purple-700 to-purple-950 border-purple-600/30",
    iconClassName: "text-purple-200",
    titleClassName: "text-white",
    captionClassName: "text-white/70",
  },
  {
    id: "top-interview",
    titleKey: "banners.topInterview.title",
    captionKey: "banners.topInterview.caption",
    icon: Trophy,
    className:
      "bg-gradient-to-br from-blue-600 to-blue-950 border-blue-500/30",
    iconClassName: "text-blue-200",
    titleClassName: "text-white",
    captionClassName: "text-white/70",
  },
];

export function FeatureBanners() {
  const { t } = useTranslation("problems");

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
            <p
              className={`text-sm font-semibold leading-tight ${banner.titleClassName}`}
            >
              {t(banner.titleKey)}
            </p>
            <p
              className={`text-xs leading-tight ${banner.captionClassName}`}
            >
              {t(banner.captionKey)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
