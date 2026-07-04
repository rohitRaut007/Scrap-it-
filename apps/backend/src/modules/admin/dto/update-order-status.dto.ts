import { IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator";
import { OrderStatus } from "@prisma/client";

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  totalWeightKg?: number;
}
