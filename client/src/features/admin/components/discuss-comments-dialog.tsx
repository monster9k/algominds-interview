import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAdminDiscussComments } from "../hooks/use-admin-discuss-comments";
import { useBanDiscussComment } from "../hooks/use-ban-discuss-comment";
import { ConfirmDialog } from "./confirm-dialog";

interface DiscussCommentsDialogProps {
  postId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function DiscussCommentsDialog({ postId, onOpenChange }: DiscussCommentsDialogProps) {
  const { t } = useTranslation("admin");
  const { data: comments, isLoading, isError } = useAdminDiscussComments(postId);
  const banComment = useBanDiscussComment();
  const [banningId, setBanningId] = useState<string | null>(null);

  return (
    <Dialog open={!!postId} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("discuss.commentsDialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : isError ? (
            <p className="py-8 text-center text-sm text-destructive">
              {t("discuss.commentsLoadError")}
            </p>
          ) : comments?.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("discuss.commentsEmpty")}
            </p>
          ) : (
            comments?.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.author.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    {comment.deletedAt && (
                      <span
                        className={cn(
                          "text-xs font-medium text-red-500 flex items-center gap-1",
                        )}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                        {t("discuss.bannedLabel")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setBanningId(comment.id)}
                  disabled={!!comment.deletedAt}
                >
                  <Ban className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>

      <ConfirmDialog
        open={!!banningId}
        onOpenChange={(open) => !open && setBanningId(null)}
        title={t("discuss.banConfirmTitle")}
        description={t("discuss.banConfirmDescription")}
        isLoading={banComment.isPending}
        onConfirm={() => {
          if (!banningId || !postId) return;
          banComment.mutate(
            { postId, commentId: banningId },
            { onSuccess: () => setBanningId(null) },
          );
        }}
      />
    </Dialog>
  );
}
