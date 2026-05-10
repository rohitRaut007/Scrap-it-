import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { OrderStatus } from "@prisma/client";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class ListOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const v = value.toLowerCase();
      if (v === "true" || v === "1") return true;
      if (v === "false" || v === "0") return false;
    }
    return value;
  })
  @IsBoolean()
  activeOnly?: boolean;
}
