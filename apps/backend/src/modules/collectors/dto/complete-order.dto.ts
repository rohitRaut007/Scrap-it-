import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class CompleteOrderItemDto {
  @IsUUID("4")
  categoryId!: string;

  @IsNumber()
  @Min(0.1)
  @Max(10000)
  weightKg!: number;

  /** Per-pickup override; defaults to the collector's saved rate card when omitted. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  rateInrPerKg?: number;
}

export class CompleteOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CompleteOrderItemDto)
  items!: CompleteOrderItemDto[];
}
