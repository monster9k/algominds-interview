import api from "@/lib/axios";
import { UserProfileResponse } from "../types";

export const usersApi = {
  getMe: async (): Promise<UserProfileResponse> => {
    const response = await api.get("/users/me");
    return response.data;
  },
};
