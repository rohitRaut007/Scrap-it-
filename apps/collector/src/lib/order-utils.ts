// Status semantics match apps/admin/src/lib/order-utils.ts and mobile exactly.

export type OrderStatus =
  | "scheduled"
  | "assigned"
  | "en_route"
  | "arriving"
  | "completed"
  | "cancelled";

/** Labels written from the collector's point of view. */
export function orderStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    scheduled: "New",
    assigned: "Accepted",
    en_route: "On the way",
    arriving: "Arriving",
    completed: "Completed",
    cancelled: "Cancelled",
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

/** Primary call-to-action for an order in the given state. */
export function nextAction(
  status: OrderStatus,
  isAvailable: boolean,
): { label: string; next: OrderStatus } | null {
  if (isAvailable) return { label: "Accept pickup", next: "assigned" };
  if (status === "assigned") return { label: "Start journey", next: "en_route" };
  if (status === "en_route") return { label: "I've arrived", next: "arriving" };
  if (status === "arriving")
    return { label: "Weigh & complete", next: "completed" };
  return null;
}
