import type { OrderStatus } from "@prisma/client";

export class DriverDto {
  id!: string;
  name!: string;
  rating!: number;
}

export class OrderItemDto {
  label!: string;
  quantity!: number;
}

export class OrderDto {
  id!: string;
  status!: OrderStatus;
  categoryIds!: string[];
  scheduledAt!: string;
  etaMinutes!: number | null;
  driver!: DriverDto | null;
  addressId!: string;
  addressLine!: string;
  items!: OrderItemDto[];
  totalWeightKg!: number | null;
  photoUrls!: string[];
  createdAt!: string;
  cancelledAt!: string | null;
  hasRating!: boolean;
}

export class OrderResponse {
  data!: OrderDto;
}

export class OrderListResponse {
  data!: OrderDto[];
  page!: number;
  pageSize!: number;
  total!: number;
}

export class ActiveOrderResponse {
  data!: OrderDto | null;
}

/** Result of a guest (no-account) booking made from a collector's `/book/:slug` page. */
export class GuestBookingResultDto {
  orderId!: string;
  scheduledAt!: string;
  /** False if the slug was stale/inactive and the order fell back to the open pool. */
  assignedDirect!: boolean;
  collectorName!: string | null;
}

export class GuestBookingResponse {
  data!: GuestBookingResultDto;
}
