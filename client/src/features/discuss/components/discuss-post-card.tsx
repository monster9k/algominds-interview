import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, MessageCircle, ArrowBigUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToggleUpvote } from "../hooks/use-toggle-upvote";
import { DiscussPostSummary } from "../types";
import { formatRelativeTime } from "../utils/format-relative-time";
import { getTagColorClass } from "../utils/tag-color";

interface DiscussPostCardProps {
  post: DiscussPostSummary;
}

export function DiscussPostCard({ post }: DiscussPostCardProps) {
  const { t } = useTranslation("discuss");
  const toggleUpvote = useToggleUpvote();

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={post.author.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {post.author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-primary">
            {post.author.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(post.createdAt, t)}
          </span>
        </div>

        <Link to={`/discuss/${post.id}`} className="block group">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {post.content}
          </p>
        </Link>

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

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount}
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
              className={cn("h-3.5 w-3.5", post.upvoted && "fill-primary")}
            />
            {post.upvoteCount}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
