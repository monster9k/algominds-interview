import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiscussPosts } from "@/features/discuss/hooks/use-discuss-posts";

export function AdminDiscussTable() {
  const { t } = useTranslation("admin");
  const { data: posts, isLoading, isError } = useDiscussPosts();

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="text-muted-foreground text-xs">{t("discuss.columnId")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("discuss.columnTitle")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("discuss.columnAuthor")}</TableHead>
            <TableHead className="text-center text-muted-foreground text-xs">{t("discuss.columnViews")}</TableHead>
            <TableHead className="text-center text-muted-foreground text-xs">{t("discuss.columnUpvotes")}</TableHead>
            <TableHead className="text-center text-muted-foreground text-xs">{t("discuss.columnComments")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("discuss.columnCreatedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={7}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell colSpan={7} className="h-32 text-center text-destructive">
                {t("discuss.loadError")}
              </TableCell>
            </TableRow>
          ) : posts?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                {t("discuss.empty")}
              </TableCell>
            </TableRow>
          ) : (
            posts?.map((post) => (
              <TableRow key={post.id} className="border-0 hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {post.id.slice(0, 8)}
                </TableCell>
                <TableCell className="font-medium text-foreground max-w-xs truncate">
                  {post.title}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{post.author.name}</TableCell>
                <TableCell className="text-center text-muted-foreground text-xs">{post.viewCount}</TableCell>
                <TableCell className="text-center text-muted-foreground text-xs">{post.upvoteCount}</TableCell>
                <TableCell className="text-center text-muted-foreground text-xs">{post.commentCount}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(post.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
