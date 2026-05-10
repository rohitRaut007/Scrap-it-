import { api } from "@/lib/api";
import type { AnalyticsSummary } from "@/types/domain";

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    return api.get<AnalyticsSummary>("/analytics/summary");
  },
};
