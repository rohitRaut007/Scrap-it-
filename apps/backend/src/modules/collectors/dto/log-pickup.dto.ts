import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class LogPickupItemDto {
  @IsUUID("4")
  categoryId!: string;

  @IsNumber()
  @Min(0.1)
  @Max(10000)
  weightKg!: number;
}

/** A pickup a collector logs for their own existing customer, found outside the app. */
export class LogPickupDto {
  @IsString()
  @Length(1, 120)
  customerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LogPickupItemDto)
  items!: LogPickupItemDto[];
}
