import { useTranslation } from "react-i18next";
import { Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTrendingTags } from "../hooks/use-trending-tags";
import { DiscussSort } from "../types";

const SORT_OPTIONS: DiscussSort[] = ["newest", "mostViewed", "mostUpvoted"];

interface DiscussFilterBarProps {
  sort: DiscussSort;
  onSortChange: (sort: DiscussSort) => void;
  tag: string | undefined;
  onTagChange: (tag: string | undefined) => void;
}

export function DiscussFilterBar({
  sort,
  onSortChange,
  tag,
  onTagChange,
}: DiscussFilterBarProps) {
  const { t } = useTranslation("discuss");
  const { data: tags } = useTrendingTags();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-3.5 w-3.5" />
            {tag ? tags?.find((t2) => t2.slug === tag)?.name : t("filter.all")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={tag ?? "all"}
            onValueChange={(value) =>
              onTagChange(value === "all" ? undefined : value)
            }
          >
            <DropdownMenuRadioItem value="all">
              {t("filter.all")}
            </DropdownMenuRadioItem>
            {tags?.map((tagOption) => (
              <DropdownMenuRadioItem key={tagOption.id} value={tagOption.slug}>
                {tagOption.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="h-3.5 w-3.5" />
            {t(`sort.${sort}`)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={sort}
            onValueChange={(value) => onSortChange(value as DiscussSort)}
          >
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {t(`sort.${option}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
