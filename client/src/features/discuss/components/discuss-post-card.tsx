import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, MessageCircle, ArrowBigUp, MoreHorizontal, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/discuss/${post.id}`);
    toast.success(t("linkCopied"));
  };

  return (
    <div className="group px-4 py-4 sm:px-5 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={post.author.avatarUrl ?? undefined} />
          <AvatarFallback className="text-[10px]">
            {post.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground">
          {post.author.name}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(post.createdAt, t)}
        </span>
      </div>

      <Link to={`/discuss/${post.id}`} className="mt-1.5 block">
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {post.content}
        </p>
      </Link>

      {post.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
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

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
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
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {post.viewCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {post.commentCount}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyLink}>
              <Link2 className="h-3.5 w-3.5" />
              {t("copyLink")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
