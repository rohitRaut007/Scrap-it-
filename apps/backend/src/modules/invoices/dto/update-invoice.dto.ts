import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { InvoiceItemInputDto } from "./invoice-item.dto";

/** Only valid while the invoice is still DRAFT — enforced in the service, not here. */
export class UpdateInvoiceDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  billingMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  billingYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  payableTo?: string;

  /** Commercial-only — ignored/nulled server-side for a RESIDENTIAL bill type. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  referencePoNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  termsOfPayment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  termsAndConditions?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInputDto)
  items?: InvoiceItemInputDto[];
}
