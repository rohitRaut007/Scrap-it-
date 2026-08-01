import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from "class-validator";

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsUUID("4", { each: true })
  categoryIds!: string[];

  @IsISO8601()
  scheduledAt!: string;

  @IsUUID("4")
  addressId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(256, { each: true })
  photoStorageKeys?: string[];

  /**
   * Set when the customer booked through a collector's personal QR/booking
   * link — resolved server-side to an active collector and assigned
   * directly, bypassing the open pool. Silently ignored (falls back to the
   * normal pool flow) if the slug is unknown or that collector is inactive.
   */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/)
  collectorSlug?: string;
}
