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
