import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCollectorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  vehicleInfo?: string;
}
