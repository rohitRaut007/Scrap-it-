import { mutate } from "swr";

const ORDER_KEY_ROOTS = [
  "collector/summary",
  "collector/available",
  "collector/orders",
  "collector/order",
];

// Payout-affecting actions (complete, log a pickup) also move earnings/profile totals.
const EARNINGS_KEY_ROOTS = [...ORDER_KEY_ROOTS, "collector/earnings", "collector/profile"];

/**
 * Revalidate only the SWR keys an action could plausibly have changed.
 * "orders" — accept/decline/status updates: no payout impact.
 * "earnings" — complete / log a pickup: also touches profile + earnings totals.
 * Never touches "collector/rate-card" — categories/rates don't change from order actions.
 */
export function revalidateCollectorData(scope: "orders" | "earnings" = "orders") {
  const roots = scope === "earnings" ? EARNINGS_KEY_ROOTS : ORDER_KEY_ROOTS;
  return mutate((key) => {
    const root = Array.isArray(key) ? key[0] : key;
    return typeof root === "string" && roots.includes(root);
  });
}
