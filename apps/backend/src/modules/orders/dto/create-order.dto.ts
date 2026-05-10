import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
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
}
