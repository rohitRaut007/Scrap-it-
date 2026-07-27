import type { OrderStatus, UserRole } from "@scrap-it/types";

export { numberToWordsInr } from "./amount-in-words";
export type { ClientType, BillType } from "./invoice-bill-type";
export {
  CLIENT_TYPES,
  COMMERCIAL_CLIENT_TYPES,
  resolveBillType,
  formatBillNumber,
  DEFAULT_ITEM_DESCRIPTION,
  DEFAULT_ITEM_UNIT,
  DEFAULT_PREMISES_TYPE,
} from "./invoice-bill-type";

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
