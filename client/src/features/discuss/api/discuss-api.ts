import api from "@/lib/axios";
import {
  CreatePostPayload,
  DiscussComment,
  DiscussPostDetail,
  DiscussPostFilters,
  DiscussPostSummary,
  TopContributor,
  TrendingTag,
} from "../types";

export const discussApi = {
  getPosts: async (
    filters: DiscussPostFilters = {},
  ): Promise<DiscussPostSummary[]> => {
    const response = await api.get("/discuss", { params: filters });
    return response.data;
  },

  getPost: async (id: string): Promise<DiscussPostDetail> => {
    const response = await api.get(`/discuss/${id}`);
    return response.data;
  },

  createPost: async (
    payload: CreatePostPayload,
  ): Promise<DiscussPostSummary> => {
    const response = await api.post("/discuss", payload);
    return response.data;
  },

  createComment: async (
    postId: string,
    content: string,
  ): Promise<DiscussComment> => {
    const response = await api.post(`/discuss/${postId}/comments`, {
      content,
    });
    return response.data;
  },

  toggleUpvote: async (postId: string): Promise<{ upvoted: boolean }> => {
    const response = await api.post(`/discuss/${postId}/vote`);
    return response.data;
  },

  getTrendingTags: async (): Promise<TrendingTag[]> => {
    const response = await api.get("/discuss/tags/trending");
    return response.data;
  },

  getTopContributors: async (): Promise<TopContributor[]> => {
    const response = await api.get("/discuss/contributors/top");
    return response.data;
  },

  // Moderation — ADMIN + MODERATOR (xem RolesGuard ở discuss.controller.ts).
  deletePost: async (id: string): Promise<{ id: string }> => {
    const response = await api.delete(`/discuss/${id}`);
    return response.data;
  },
};
