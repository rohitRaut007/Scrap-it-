import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export const COLLECTOR_ORDER_SCOPES = ["active", "history", "all"] as const;
export type CollectorOrderScope = (typeof COLLECTOR_ORDER_SCOPES)[number];

export class CollectorOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(COLLECTOR_ORDER_SCOPES)
  scope: CollectorOrderScope = "active";
}
