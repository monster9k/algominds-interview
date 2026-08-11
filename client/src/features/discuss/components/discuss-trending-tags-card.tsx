import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTrendingTags } from "../hooks/use-trending-tags";
import { getTagColorClass } from "../utils/tag-color";

export function DiscussTrendingTagsCard() {
  const { t } = useTranslation("discuss");
  const { data: tags, isLoading } = useTrendingTags();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-primary" />
          {t("sidebar.trendingTags")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        ) : !tags || tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("sidebar.noTags")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className={cn("text-xs", getTagColorClass(tag.id))}
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
