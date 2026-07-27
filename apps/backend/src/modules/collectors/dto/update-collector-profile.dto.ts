import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class UpdateCollectorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  vehicleInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  serviceArea?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shopName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  shopAddressText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gstNumber?: string;

  @IsOptional()
  @IsBoolean()
  showBusinessDetailsOnReceipt?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  businessTagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  payableTo?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: "accentColor must be a 6-digit hex color" })
  accentColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  defaultTermsAndConditions?: string;
}
