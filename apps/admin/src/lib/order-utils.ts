// Mirrors apps/mobile/src/features/orders/order-status-label.ts exactly.
// Single source of truth for status display across the admin dashboard.

export type OrderStatus =
  | "scheduled"
  | "assigned"
  | "en_route"
  | "arriving"
  | "completed"
  | "cancelled";

export function orderStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    scheduled: "Scheduled",
    assigned: "Assigned",
    en_route: "On the way",
    arriving: "Arriving",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status];
}

/**
 * Returns Tailwind classes for the status badge.
 * Semantics match mobile's Badge tone exactly:
 *   scheduled/assigned → rust (primary)
 *   en_route/arriving  → signal (gold alert)
 *   completed          → cash (money green)
 *   cancelled          → neutral muted
 */
export function orderStatusClasses(status: OrderStatus): string {
  if (status === "completed") return "bg-cash/15 text-cash";
  if (status === "en_route" || status === "arriving")
    return "bg-signal/30 text-ink";
  if (status === "cancelled")
    return "bg-muted text-muted-foreground";
  // scheduled, assigned
  return "bg-primary/15 text-primary";
}

/**
 * Valid next statuses for the admin status-update endpoint.
 * NOTE: scheduled → assigned is intentionally excluded here —
 * that transition is handled by the separate assign-collector flow.
 */
export function validNextStatuses(current: OrderStatus): OrderStatus[] {
  const map: Partial<Record<OrderStatus, OrderStatus[]>> = {
    scheduled: ["cancelled"],
    assigned: ["en_route", "cancelled"],
    en_route: ["arriving"],
    arriving: ["completed"],
  };
  return map[current] ?? [];
}

export const STATUS_DISPLAY_ORDER: OrderStatus[] = [
  "scheduled",
  "assigned",
  "en_route",
  "arriving",
  "completed",
  "cancelled",
];

export function formatRelative(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function isOrderOverdue(scheduledAt: string | Date): boolean {
  return new Date(scheduledAt).getTime() < Date.now();
}
