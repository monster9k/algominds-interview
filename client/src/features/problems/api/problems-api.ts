import api from "@/lib/axios";
import { Company, Problem, ProblemFilterParams } from "../types";

export const problemsApi = {
  getProblems: async (filters?: ProblemFilterParams): Promise<Problem[]> => {
    // Backend trả về mảng trực tiếp: [ {id, title...}, ... ]
    const response = await api.get("/problems", {
      params: {
        difficulty: filters?.difficulty,
        tags: filters?.tags?.length ? filters.tags : undefined,
        search: filters?.search?.trim() || undefined,
        status: filters?.status,
        sortDirection: filters?.sortDirection,
      },
      // tags=Array&tags=Stack thay vì tags[]=Array&tags[]=Stack
      paramsSerializer: { indexes: null },
    });
    return response.data;
  },

  getCompanies: async (search?: string): Promise<Company[]> => {
    const response = await api.get("/companies", {
      params: { search: search?.trim() || undefined },
    });
    return response.data;
  },
};
