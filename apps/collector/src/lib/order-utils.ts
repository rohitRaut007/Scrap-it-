// Status semantics match apps/admin/src/lib/order-utils.ts and mobile exactly.

import type { StampTone } from "@/components/ui/stamp";

export type OrderStatus =
  | "scheduled"
  | "assigned"
  | "en_route"
  | "arriving"
  | "completed"
  | "cancelled";

/** Maps a status to its translation key under the `orders.status` namespace.
 * Falls back to "unknown" for any value outside the current enum — the
 * status ultimately comes from an API response, not a value TypeScript can
 * actually guarantee at runtime, so an unrecognized status must not crash
 * every screen that renders a StatusBadge. */
export function orderStatusMessageKey(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    scheduled: "scheduled",
    assigned: "assigned",
    en_route: "enRoute",
    arriving: "arriving",
    completed: "completed",
    cancelled: "cancelled",
  };
  return map[status] ?? "unknown";
}

/** Status semantics mapped to a `Stamp` tone for the rubber-stamp badge style. */
export function orderStatusTone(status: OrderStatus): StampTone {
  if (status === "completed") return "cash";
  if (status === "en_route" || status === "arriving") return "signal";
  if (status === "cancelled") return "muted";
  return "rust";
}

/** The collector's forward path through a pickup. */
export const COLLECTOR_STATUS_FLOW: OrderStatus[] = [
  "assigned",
  "en_route",
  "arriving",
  "completed",
];

export type OrderActionKey =
  | "acceptPickup"
  | "startJourney"
  | "arrived"
  | "weighComplete";

/**
 * Primary call-to-action for an order in the given state. `actionKey` maps
 * to a translation key under the `orders` namespace (e.g. `orders.acceptPickup`).
 */
export function nextAction(
  status: OrderStatus,
  isAvailable: boolean,
): { actionKey: OrderActionKey; next: OrderStatus } | null {
  if (isAvailable) return { actionKey: "acceptPickup", next: "assigned" };
  if (status === "assigned")
    return { actionKey: "startJourney", next: "en_route" };
  if (status === "en_route")
    return { actionKey: "arrived", next: "arriving" };
  if (status === "arriving")
    return { actionKey: "weighComplete", next: "completed" };
  return null;
}
