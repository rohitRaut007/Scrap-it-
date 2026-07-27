import { IsIn, IsOptional, IsString, Length, MaxLength } from "class-validator";
import { CLIENT_TYPES, type ClientType } from "@scrap-it/constants";

/** A collector's own recurring billing account (a site/society they invoice monthly). */
export class CreateClientDto {
  @IsIn(CLIENT_TYPES)
  type!: ClientType;

  @IsString()
  @Length(1, 160)
  siteName!: string;

  /** Bold display name on the bill, e.g. "Home Rising Residential". Falls back to siteName when blank. */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  entityName?: string;

  /** Descriptive line under the entity name, e.g. "Residential Society" / "Commercial Premises". */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  premisesType?: string;

  /** Client's own GSTIN — display-only, no strict format check. */
  @IsOptional()
  @IsString()
  @MaxLength(15)
  gstin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressText?: string;

  /** Bill-to address, only when it differs from the site address. */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  billToAddressText?: string;
}
