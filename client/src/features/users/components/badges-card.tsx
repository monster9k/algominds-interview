import { ArrowRight, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_BADGE } from "../utils/mock-data";

// TODO: Requires backend schema — no Badge model exists yet, stays mocked.
export function BadgesCard() {
  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Badges</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <span className="text-2xl font-bold text-foreground mt-1">
          {MOCK_BADGE.totalCount}
        </span>

        <div className="mt-auto pt-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <Award className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Most Recent Badge</p>
            <p className="text-xs font-medium text-foreground truncate">
              {MOCK_BADGE.mostRecentName}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
