import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  danger?: boolean;
  className?: string;
  onClick?: () => void;
}

export function SettingsRow({
  icon: Icon,
  label,
  value,
  danger,
  className,
  onClick,
}: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-muted/30",
        className,
      )}
    >
      <Icon
        className={cn("h-4 w-4 shrink-0", danger ? "text-red-500" : "text-muted-foreground")}
      />
      <span
        className={cn(
          "text-sm font-medium",
          danger ? "text-red-500" : "text-foreground",
        )}
      >
        {label}
      </span>
      {value && (
        <span className="text-sm text-muted-foreground truncate">
          {value}
        </span>
      )}
      <ChevronRight
        className={cn(
          "h-4 w-4 ml-auto shrink-0",
          danger ? "text-red-500" : "text-muted-foreground",
        )}
      />
    </button>
  );
}
