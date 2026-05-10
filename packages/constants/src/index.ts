import type { OrderStatus, UserRole } from "@scrap-it/types";

export const USER_ROLES: readonly UserRole[] = [
  "customer",
  "collector",
  "admin",
] as const;

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "scheduled",
  "assigned",
  "en_route",
  "arriving",
  "completed",
  "cancelled",
] as const;
