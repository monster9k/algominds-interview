import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import type { SessionsTimeseriesRange } from "../types";

export const useAdminSessionsTimeseries = (range: SessionsTimeseriesRange) => {
  return useQuery({
    queryKey: ["admin-sessions-timeseries", range],
    queryFn: () => adminApi.getSessionsTimeseries(range),
  });
};
