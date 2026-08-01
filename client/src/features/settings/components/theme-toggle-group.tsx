import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", icon: Sun, labelKey: "appearance.light" },
  { value: "dark", icon: Moon, labelKey: "appearance.dark" },
  { value: "system", icon: Monitor, labelKey: "appearance.system" },
] as const;

export function ThemeToggleGroup() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation("settings");

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
      {themeOptions.map((option) => {
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors duration-150",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <option.icon className="h-3.5 w-3.5" />
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
