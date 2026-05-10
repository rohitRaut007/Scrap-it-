import type { OrderStatus } from "@/types/domain";

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

export function orderStatusTone(
  status: OrderStatus
): "default" | "success" | "warning" | "neutral" {
  if (status === "completed") return "success";
  if (status === "arriving" || status === "en_route") return "warning";
  if (status === "cancelled") return "neutral";
  return "default";
}
