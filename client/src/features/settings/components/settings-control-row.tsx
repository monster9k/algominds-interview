import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsControlRowProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsControlRow({
  icon: Icon,
  label,
  description,
  children,
  className,
}: SettingsControlRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="ml-auto shrink-0">{children}</div>
    </div>
  );
}
