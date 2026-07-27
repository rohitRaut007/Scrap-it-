import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { InvoiceItemInputDto } from "./invoice-item.dto";

export class CreateInvoiceDto {
  @IsUUID("4")
  clientId!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  billingMonth!: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  billingYear!: number;

  /** Cheque payee name; defaults from the collector's saved payableTo when omitted. */
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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInputDto)
  items!: InvoiceItemInputDto[];
}
