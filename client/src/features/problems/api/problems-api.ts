import api from "@/lib/axios";
import { Problem } from "../types";

export const problemsApi = {
  getProblems: async (): Promise<Problem[]> => {
    // Backend trả về mảng trực tiếp: [ {id, title...}, ... ]
    const response = await api.get("/problems");
    return response.data;
  },
};
