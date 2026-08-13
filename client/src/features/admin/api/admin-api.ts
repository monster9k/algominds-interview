import api from "@/lib/axios";
import {
  AdminStats,
  AdminUser,
  AdminQuestSnippet,
  AdminPeerInterviewSession,
  PaginatedResponse,
  AdminListQuery,
  AdminProblemListItem,
  AdminProblemDetail,
  ProblemFormPayload,
  AdminContestListItem,
  ContestFormPayload,
  AdminAuditLogEntry,
  SessionsTimeseriesRange,
  SessionsTimeseriesPoint,
  SessionStatusBreakdownItem,
  AcceptanceByDifficultyItem,
  TopCompanyItem,
  AdminShopItem,
  ShopItemFormPayload,
  AdminCareerTrack,
  CareerTrackFormPayload,
  BugSnippetFormPayload,
  AdminDiscussComment,
} from "../types";

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get("/admin/stats");
    return response.data;
  },

  getSessionsTimeseries: async (
    range: SessionsTimeseriesRange,
  ): Promise<SessionsTimeseriesPoint[]> => {
    const response = await api.get("/admin/stats/sessions-timeseries", {
      params: { range },
    });
    return response.data;
  },

  getSessionStatusBreakdown: async (): Promise<SessionStatusBreakdownItem[]> => {
    const response = await api.get("/admin/stats/session-status");
    return response.data;
  },

  getAcceptanceByDifficulty: async (): Promise<AcceptanceByDifficultyItem[]> => {
    const response = await api.get("/admin/stats/acceptance-by-difficulty");
    return response.data;
  },

  getTopCompanies: async (): Promise<TopCompanyItem[]> => {
    const response = await api.get("/admin/stats/top-companies");
    return response.data;
  },

  getUsers: async (
    query: AdminListQuery,
  ): Promise<PaginatedResponse<AdminUser>> => {
    const response = await api.get("/admin/users", { params: query });
    return response.data;
  },

  updateUserRole: async (id: string, role: string) => {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getQuests: async (): Promise<AdminQuestSnippet[]> => {
    const response = await api.get("/admin/quests");
    return response.data;
  },

  getPeerInterviews: async (): Promise<AdminPeerInterviewSession[]> => {
    const response = await api.get("/admin/peer-interviews");
    return response.data;
  },

  getProblems: async (
    query: AdminListQuery,
  ): Promise<PaginatedResponse<AdminProblemListItem>> => {
    const response = await api.get("/admin/problems", { params: query });
    return response.data;
  },

  getProblem: async (id: string): Promise<AdminProblemDetail> => {
    const response = await api.get(`/admin/problems/${id}`);
    return response.data;
  },

  createProblem: async (payload: ProblemFormPayload) => {
    const response = await api.post("/problems", payload);
    return response.data;
  },

  updateProblem: async (id: string, payload: Partial<ProblemFormPayload>) => {
    const response = await api.patch(`/problems/${id}`, payload);
    return response.data;
  },

  deleteProblem: async (id: string) => {
    const response = await api.delete(`/problems/${id}`);
    return response.data;
  },

  getContests: async (
    query: AdminListQuery,
  ): Promise<PaginatedResponse<AdminContestListItem>> => {
    const response = await api.get("/admin/contests", { params: query });
    return response.data;
  },

  createContest: async (payload: ContestFormPayload) => {
    const response = await api.post("/contests", payload);
    return response.data;
  },

  updateContest: async (id: string, payload: Partial<ContestFormPayload>) => {
    const response = await api.patch(`/contests/${id}`, payload);
    return response.data;
  },

  deleteContest: async (id: string) => {
    const response = await api.delete(`/contests/${id}`);
    return response.data;
  },

  getStoreItems: async (): Promise<AdminShopItem[]> => {
    const response = await api.get("/admin/store/items");
    return response.data;
  },

  createShopItem: async (payload: ShopItemFormPayload) => {
    const response = await api.post("/store/items", payload);
    return response.data;
  },

  updateShopItem: async (id: string, payload: Partial<ShopItemFormPayload>) => {
    const response = await api.patch(`/store/items/${id}`, payload);
    return response.data;
  },

  deleteShopItem: async (id: string) => {
    const response = await api.delete(`/store/items/${id}`);
    return response.data;
  },

  getCareerTracks: async (): Promise<AdminCareerTrack[]> => {
    const response = await api.get("/admin/career/tracks");
    return response.data;
  },

  createCareerTrack: async (payload: CareerTrackFormPayload) => {
    const response = await api.post("/career/tracks", payload);
    return response.data;
  },

  updateCareerTrack: async (id: string, payload: Partial<CareerTrackFormPayload>) => {
    const response = await api.patch(`/career/tracks/${id}`, payload);
    return response.data;
  },

  deleteCareerTrack: async (id: string) => {
    const response = await api.delete(`/career/tracks/${id}`);
    return response.data;
  },

  createBugSnippet: async (payload: BugSnippetFormPayload) => {
    const response = await api.post("/quest/snippets", payload);
    return response.data;
  },

  updateBugSnippet: async (id: string, payload: Partial<BugSnippetFormPayload>) => {
    const response = await api.patch(`/quest/snippets/${id}`, payload);
    return response.data;
  },

  deleteBugSnippet: async (id: string) => {
    const response = await api.delete(`/quest/snippets/${id}`);
    return response.data;
  },

  forceAbandonPeerInterview: async (id: string) => {
    const response = await api.patch(`/peer-interviews/${id}/status`, {
      status: "ABANDONED",
    });
    return response.data;
  },

  getDiscussComments: async (postId: string): Promise<AdminDiscussComment[]> => {
    const response = await api.get(`/admin/discuss/${postId}/comments`);
    return response.data;
  },

  banDiscussComment: async (postId: string, commentId: string) => {
    const response = await api.delete(`/discuss/${postId}/comments/${commentId}`);
    return response.data;
  },

  getAuditLog: async (
    query: Pick<AdminListQuery, "page" | "limit">,
  ): Promise<PaginatedResponse<AdminAuditLogEntry>> => {
    const response = await api.get("/admin/audit-log", { params: query });
    return response.data;
  },
};
