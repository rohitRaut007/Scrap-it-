import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class UpsertRateCardItemDto {
  @IsUUID("4")
  categoryId!: string;

  @IsNumber()
  @Min(0)
  @Max(100000)
  rateInrPerKg!: number;
}

/** Collector's own buy-rate per category — replaces the platform's baseRateInr as the
 *  authoritative rate for that collector's future pickups. */
export class UpsertRateCardDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertRateCardItemDto)
  items!: UpsertRateCardItemDto[];
}
