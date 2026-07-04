import { IsIn } from "class-validator";
import { OrderStatus } from "@prisma/client";

/** Collectors move orders forward only; completion goes through the complete endpoint. */
export const COLLECTOR_STATUS_UPDATES = [
  OrderStatus.en_route,
  OrderStatus.arriving,
] as const;

export class CollectorUpdateStatusDto {
  @IsIn(COLLECTOR_STATUS_UPDATES)
  status!: (typeof COLLECTOR_STATUS_UPDATES)[number];
}
