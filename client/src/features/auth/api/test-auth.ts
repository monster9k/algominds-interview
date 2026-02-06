import { api } from "@/lib/axios";

interface TestAuthResponse {
  message: string;
  status: string;
}

export const testAuthApi = async (): Promise<TestAuthResponse> => {
  const { data } = await api.get<TestAuthResponse>("/auth/test");
  return data;
};
