import { useMemo } from "react";
import { useOrders } from "./use-orders";

export function useAtRiskOrders() {
  const { data, isLoading, error } = useOrders({ page: 1, pageSize: 100, status: "scheduled" });
  const atRiskCount = useMemo(() => {
    if (!data) return 0;
    const now = Date.now();
    return data.data.filter((o) => new Date(o.scheduledAt).getTime() < now).length;
  }, [data]);
  return { atRiskCount, isLoading, error };
}
