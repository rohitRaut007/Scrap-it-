import useSWR from "swr";
import { adminApi } from "@/lib/api";

export interface AdminStats {
  byStatus: Record<string, number>;
  todayNewOrders: number;
  totalCollectors: number;
}

export function useStats() {
  return useSWR<AdminStats>(
    "/admin/stats",
    (url: string) => adminApi.request(url),
    {
      refreshInterval: 15_000,
      refreshWhenHidden: false,
    },
  );
}
