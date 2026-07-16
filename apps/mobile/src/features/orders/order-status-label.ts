import type { TFunction } from "i18next";
import type { OrderStatus } from "@/types/domain";

export function orderStatusLabel(status: OrderStatus, t: TFunction): string {
  return t(`orders.statusLabels.${status}`);
}

export function orderStatusTone(
  status: OrderStatus
): "default" | "success" | "warning" | "neutral" {
  if (status === "completed") return "success";
  if (status === "arriving" || status === "en_route") return "warning";
  if (status === "cancelled") return "neutral";
  return "default";
}
