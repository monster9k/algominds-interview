export interface DiscussAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface DiscussTag {
  id: string;
  name: string;
  slug: string;
}

// Shape returned by GET /discuss and GET /discuss/:id (server:
// discuss.service.ts POST_LIST_SELECT) — problemId is non-null only for
// posts scoped to a specific Problem (per-problem Discuss tab).
export interface DiscussPostSummary {
  id: string;
  title: string;
  content: string;
  problemId: string | null;
  viewCount: number;
  upvoteCount: number;
  commentCount: number;
  createdAt: string;
  author: DiscussAuthor;
  tags: { tag: DiscussTag }[];
  upvoted: boolean;
}

export interface DiscussComment {
  id: string;
  content: string;
  createdAt: string;
  author: DiscussAuthor;
}

export interface DiscussPostDetail extends DiscussPostSummary {
  comments: DiscussComment[];
}

export type DiscussSort = "newest" | "mostViewed" | "mostUpvoted";

export interface DiscussPostFilters {
  problemId?: string;
  tag?: string;
  sort?: DiscussSort;
  search?: string;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  problemId?: string;
  tagNames?: string[];
}

// Shape returned by GET /discuss/tags/trending.
export interface TrendingTag extends DiscussTag {
  postCount: number;
}

// Shape returned by GET /discuss/contributors/top.
export interface TopContributor {
  user: DiscussAuthor;
  totalUpvotes: number;
}
