import type { OrderStatus } from "@prisma/client";

export class CollectorInfoDto {
  id!: string;
  userId!: string;
  name!: string | null;
  phone!: string | null;
  vehicleInfo!: string | null;
  rating!: number | null;
}

export class AdminTimelineEntryDto {
  eventType!: string;
  occurredAt!: string;
  metadata!: unknown;
}

export class AdminOrderDto {
  id!: string;
  status!: OrderStatus;
  categoryIds!: string[];
  categoryNames!: string[];
  scheduledAt!: string;
  etaMinutes!: number | null;
  addressId!: string;
  addressLine!: string;
  totalWeightKg!: number | null;
  photoUrls!: string[];
  notes!: string | null;
  createdAt!: string;
  cancelledAt!: string | null;
  customerName!: string | null;
  customerPhone!: string | null;
  customerEmail!: string;
  customerId!: string;
  collectorInfo!: CollectorInfoDto | null;
  timeline!: AdminTimelineEntryDto[];
}

export class AdminOrderListResponse {
  data!: AdminOrderDto[];
  page!: number;
  pageSize!: number;
  total!: number;
}

export class AdminStatsDto {
  byStatus!: Record<string, number>;
  todayNewOrders!: number;
  totalCollectors!: number;
}

export class CollectorAdminDto {
  id!: string;
  userId!: string;
  name!: string | null;
  email!: string;
  phone!: string | null;
  vehicleInfo!: string | null;
  rating!: number | null;
  createdAt!: string;
}

export class CollectorListResponse {
  data!: CollectorAdminDto[];
  page!: number;
  pageSize!: number;
  total!: number;
}
