import { IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min } from "class-validator";

export class InvoiceItemInputDto {
  /** Optional — defaults server-side to the bill type's canned description when omitted. */
  @IsOptional()
  @IsString()
  @Length(1, 200)
  description?: string;

  @IsNumber()
  @Min(0.01)
  @Max(1_000_000)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsNumber()
  @Min(0)
  @Max(10_000_000)
  rate!: number;
}
