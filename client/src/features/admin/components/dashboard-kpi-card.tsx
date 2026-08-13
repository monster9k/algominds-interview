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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        {isLoading ? (
          <Skeleton className="mt-2.5 h-7 w-20" />
        ) : (
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {value}
            </span>
            {deltaPct !== undefined && (
              <span
                className={cn(
                  "flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-xs font-medium",
                  isPositive
                    ? "bg-teal-500/10 text-teal-500 border-teal-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20",
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
          </div>
        )}
        {!isLoading && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {compareLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
