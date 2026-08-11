import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowBigUp, ArrowLeft, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateComment } from "../hooks/use-create-comment";
import { useDiscussPost } from "../hooks/use-discuss-post";
import { useToggleUpvote } from "../hooks/use-toggle-upvote";
import { formatRelativeTime } from "../utils/format-relative-time";
import { getTagColorClass } from "../utils/tag-color";

export function DiscussPostPage() {
  const { t } = useTranslation("discuss");
  const { postId } = useParams<{ postId: string }>();
  const { data: post, isLoading, isError } = useDiscussPost(postId);
  const toggleUpvote = useToggleUpvote();
  const createComment = useCreateComment(postId ?? "");
  const [commentContent, setCommentContent] = useState("");

  const handleSubmitComment = () => {
    if (!commentContent.trim() || !postId) return;
    createComment.mutate(commentContent.trim(), {
      onSuccess: () => setCommentContent(""),
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto pb-10 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="w-full max-w-3xl mx-auto pb-10">
        <p className="text-sm text-destructive">{t("loadError")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-10 space-y-6">
      <Link
        to="/discuss"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("backToList")}
      </Link>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {post.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-primary">
                {post.author.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(post.createdAt, t)}
              </p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-foreground">{post.title}</h1>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {post.content}
          </p>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className={cn("text-[10px]", getTagColorClass(tag.id))}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
            <span className="flex items-center gap-1">
              {t("viewCount", { count: post.viewCount })}
            </span>
            <button
              type="button"
              onClick={() => toggleUpvote.mutate(post.id)}
              disabled={toggleUpvote.isPending}
              className={cn(
                "flex items-center gap-1 transition-colors hover:text-primary",
                post.upvoted && "text-primary font-semibold",
              )}
            >
              <ArrowBigUp
                className={cn("h-4 w-4", post.upvoted && "fill-primary")}
              />
              {post.upvoteCount}
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <MessageCircle className="h-4 w-4" />
          {t("comments.title", { count: post.comments.length })}
        </h2>

        <Card>
          <CardContent className="p-4 space-y-2">
            <Textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={t("comments.placeholder")}
              className="min-h-[80px]"
            />
            <Button
              size="sm"
              disabled={!commentContent.trim() || createComment.isPending}
              onClick={handleSubmitComment}
            >
              {t("comments.submit")}
            </Button>
          </CardContent>
        </Card>

        {post.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t("comments.empty")}
          </p>
        ) : (
          post.comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.author.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-primary">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.createdAt, t)}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
