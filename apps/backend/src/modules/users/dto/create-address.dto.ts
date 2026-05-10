import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from "class-validator";

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @IsString()
  @MaxLength(200)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
