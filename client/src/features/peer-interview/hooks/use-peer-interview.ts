import { useQuery } from "@tanstack/react-query";
import { peerInterviewApi } from "../api/peer-interview-api";

export const usePeerInterview = (id?: string) => {
  return useQuery({
    queryKey: ["peer-interview", id],
    queryFn: () => peerInterviewApi.getById(id!),
    enabled: !!id,
    // Chưa có socket event báo "peer vừa join" — poll nhẹ trong lúc còn
    // WAITING_FOR_PEER để bên tạo phiên tự thấy invite code đã được dùng,
    // dừng poll ngay khi phiên đã ACTIVE/kết thúc.
    refetchInterval: (query) =>
      query.state.data?.status === "WAITING_FOR_PEER" ? 3000 : false,
  });
};
