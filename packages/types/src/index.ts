/** Aligns with mobile domain + backend enums (keep serializable). */

export type UserRole = "customer" | "collector" | "admin";

export type OrderStatus =
  | "scheduled"
  | "assigned"
  | "en_route"
  | "arriving"
  | "completed"
  | "cancelled";

export interface ApiMeta {
  requestId?: string;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: ApiMeta;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
