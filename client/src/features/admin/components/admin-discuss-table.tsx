import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDiscussPosts } from "@/features/discuss/hooks/use-discuss-posts";
import { useDeleteDiscussPost } from "@/features/discuss/hooks/use-delete-discuss-post";
import { ConfirmDialog } from "./confirm-dialog";
import { DiscussCommentsDialog } from "./discuss-comments-dialog";

export function AdminDiscussTable() {
  const { t } = useTranslation("admin");
  const { data: posts, isLoading, isError } = useDiscussPosts();
  const deletePost = useDeleteDiscussPost();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingCommentsPostId, setViewingCommentsPostId] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("discuss.columnId")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("discuss.columnTitle")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("discuss.columnAuthor")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("discuss.columnViews")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("discuss.columnUpvotes")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("discuss.columnComments")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("discuss.columnCreatedAt")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnActions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={8} className="py-2.5">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={8}
                className="h-32 text-center text-destructive"
              >
                {t("discuss.loadError")}
              </TableCell>
            </TableRow>
          ) : posts?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={8}
                className="h-32 text-center text-muted-foreground"
              >
                {t("discuss.empty")}
              </TableCell>
            </TableRow>
          ) : (
            posts?.map((post) => (
              <TableRow
                key={post.id}
                className="border-0 hover:bg-muted/50 transition-colors"
              >
                <TableCell className="py-2.5 text-muted-foreground text-xs font-mono align-middle">
                  {post.id.slice(0, 8)}
                </TableCell>
                <TableCell className="py-2.5 font-medium text-foreground max-w-xs truncate align-middle">
                  {post.title}
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs align-middle">
                  {post.author.name}
                </TableCell>
                <TableCell className="py-2.5 text-center text-muted-foreground text-xs align-middle">
                  {post.viewCount}
                </TableCell>
                <TableCell className="py-2.5 text-center text-muted-foreground text-xs align-middle">
                  {post.upvoteCount}
                </TableCell>
                <TableCell className="py-2.5 text-center text-muted-foreground text-xs align-middle">
                  {post.commentCount}
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs align-middle">
                  {new Date(post.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-2.5 px-2 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title={t("discuss.viewComments")}
                      onClick={() => setViewingCommentsPostId(post.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(post.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t("discuss.deleteConfirmTitle")}
        description={t("discuss.deleteConfirmDescription")}
        isLoading={deletePost.isPending}
        onConfirm={() => {
          if (!deletingId) return;
          deletePost.mutate(deletingId, {
            onSuccess: () => setDeletingId(null),
          });
        }}
      />

      <DiscussCommentsDialog
        postId={viewingCommentsPostId}
        onOpenChange={(open) => !open && setViewingCommentsPostId(null)}
      />
    </div>
  );
}
