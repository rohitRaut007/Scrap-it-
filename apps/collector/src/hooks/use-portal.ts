"use client";

import useSWR from "swr";
import { collectorApi } from "@/lib/api";

/** Poll interval for lists that change as customers book / others accept. */
const LIVE_REFRESH_MS = 30_000;

export function useSummary() {
  return useSWR("collector/summary", () => collectorApi.summary(), {
    refreshInterval: LIVE_REFRESH_MS,
  });
}

export function useProfile() {
  return useSWR("collector/profile", () => collectorApi.profile());
}

export function useAvailableOrders(page = 1) {
  return useSWR(
    ["collector/available", page],
    () => collectorApi.availableOrders(page),
    { refreshInterval: LIVE_REFRESH_MS },
  );
}

export function useMyOrders(scope: "active" | "history", page = 1) {
  return useSWR(
    ["collector/orders", scope, page],
    () => collectorApi.myOrders(scope, page),
    { refreshInterval: scope === "active" ? LIVE_REFRESH_MS : undefined },
  );
}

export function useOrder(id: string | null) {
  return useSWR(id ? ["collector/order", id] : null, () =>
    collectorApi.order(id!),
  );
}

export function useEarnings(days = 30) {
  return useSWR(["collector/earnings", days], () =>
    collectorApi.earnings(days),
  );
}

/** Rates change daily, not live — no polling. */
export function useRateCard() {
  return useSWR("collector/rate-card", () => collectorApi.rateCard());
}
