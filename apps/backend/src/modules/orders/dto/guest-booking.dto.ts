import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

/**
 * A booking made directly from a collector's public `/book/:slug` page by
 * someone with no account — no JWT, no saved address. `OrdersService`
 * resolves an identity from `phone` (see `normalizeIndianPhone`) instead of
 * trusting a `userId`. Loose format checks only here; `phone`'s real
 * validation/normalization happens server-side in the service.
 */
export class GuestBookingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(/^[0-9+\-\s]{6,20}$/)
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  addressLine!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsUUID("4", { each: true })
  categoryIds!: string[];

  @IsISO8601()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
