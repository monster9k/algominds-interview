import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  deltaPct?: number;
  compareLabel: string;
  isLoading: boolean;
}

export function DashboardKpiCard({
  icon: Icon,
  label,
  value,
  deltaPct,
  compareLabel,
  isLoading,
}: DashboardKpiCardProps) {
  const isPositive = (deltaPct ?? 0) >= 0;

  return (
    <Card className="rounded-xl border-border/60 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        {isLoading ? (
          <Skeleton className="mt-2 h-8 w-24" />
        ) : (
          <div className="mt-1.5 text-3xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {value}
          </div>
        )}
        {!isLoading && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {deltaPct !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  isPositive ? "text-teal-500" : "text-red-500",
                )}
              >
                {isPositive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {Math.abs(deltaPct)}%
              </span>
            )}
            <span className="text-muted-foreground">{compareLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
