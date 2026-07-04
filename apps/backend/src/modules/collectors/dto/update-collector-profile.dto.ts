import { IsOptional, IsString, MaxLength } from "class-validator";

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
}
