import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePostDialog } from "../components/create-post-dialog";
import { DiscussCommunityRulesCard } from "../components/discuss-community-rules-card";
import { DiscussFilterBar } from "../components/discuss-filter-bar";
import { DiscussPostCard } from "../components/discuss-post-card";
import { DiscussTopContributorsCard } from "../components/discuss-top-contributors-card";
import { DiscussTrendingTagsCard } from "../components/discuss-trending-tags-card";
import { useDiscussPosts } from "../hooks/use-discuss-posts";
import { DiscussSort } from "../types";

export function DiscussListPage() {
  const { t } = useTranslation("discuss");
  const [sort, setSort] = useState<DiscussSort>("newest");
  const [tag, setTag] = useState<string | undefined>(undefined);

  const { data: posts, isLoading, isError } = useDiscussPosts({ sort, tag });

  return (
    <div className="w-full max-w-6xl mx-auto pb-10 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <DiscussFilterBar
            sort={sort}
            onSortChange={setSort}
            tag={tag}
            onTagChange={setTag}
          />
          <CreatePostDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="min-w-0 rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="p-6 text-sm text-destructive">{t("loadError")}</p>
          ) : !posts || posts.length === 0 ? (
            <p className="p-10 text-sm text-muted-foreground text-center">
              {t("empty")}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {posts.map((post) => (
                <DiscussPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <DiscussTrendingTagsCard />
          <DiscussTopContributorsCard />
          <DiscussCommunityRulesCard />
        </div>
      </div>
    </div>
  );
}
