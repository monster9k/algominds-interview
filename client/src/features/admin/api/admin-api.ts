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
} from "../types";

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get("/admin/stats");
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

  getAuditLog: async (
    query: Pick<AdminListQuery, "page" | "limit">,
  ): Promise<PaginatedResponse<AdminAuditLogEntry>> => {
    const response = await api.get("/admin/audit-log", { params: query });
    return response.data;
  },
};
