import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePostDialog } from "@/features/discuss/components/create-post-dialog";
import { DiscussPostCard } from "@/features/discuss/components/discuss-post-card";
import { useDiscussPosts } from "@/features/discuss/hooks/use-discuss-posts";

interface DiscussTabProps {
  problemId: string;
  problemTitle: string;
}

// Tab "Thảo luận" gắn theo đúng bài toán đang làm — tái dùng nguyên
// component/hook của feature discuss, chỉ lọc theo problemId (kiểu tab
// Discuss của LeetCode thật), không tạo lại UI riêng.
export function DiscussTab({ problemId, problemTitle }: DiscussTabProps) {
  const { t } = useTranslation("interview");
  const { data: posts, isLoading, isError } = useDiscussPosts({ problemId });

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-end">
        <CreatePostDialog
          defaultProblemId={problemId}
          defaultProblemTitle={problemTitle}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          {t("problemPanel.discussTab.loadError")}
        </p>
      ) : !posts || posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t("problemPanel.discussTab.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <DiscussPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
