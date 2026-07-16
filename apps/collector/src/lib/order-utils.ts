// Status semantics match apps/admin/src/lib/order-utils.ts and mobile exactly.

export type OrderStatus =
  | "scheduled"
  | "assigned"
  | "en_route"
  | "arriving"
  | "completed"
  | "cancelled";

/** Maps a status to its translation key under the `orders.status` namespace. */
export function orderStatusMessageKey(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    scheduled: "scheduled",
    assigned: "assigned",
    en_route: "enRoute",
    arriving: "arriving",
    completed: "completed",
    cancelled: "cancelled",
  };
  return map[status];
}

export function orderStatusClasses(status: OrderStatus): string {
  if (status === "completed") return "bg-cash/15 text-cash";
  if (status === "en_route" || status === "arriving")
    return "bg-signal/30 text-ink";
  if (status === "cancelled") return "bg-muted text-muted-foreground";
  // scheduled, assigned
  return "bg-primary/15 text-primary";
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
