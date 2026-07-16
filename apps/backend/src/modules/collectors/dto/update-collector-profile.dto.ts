import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

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
}
