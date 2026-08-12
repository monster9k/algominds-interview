import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{value}</span>
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
          <p className="mt-1 text-xs text-muted-foreground">{compareLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
