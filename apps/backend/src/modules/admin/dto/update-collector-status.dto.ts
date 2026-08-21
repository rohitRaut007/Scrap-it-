import { IsEnum, IsOptional, IsString } from "class-validator";
import { CollectorStatus } from "@prisma/client";

export class UpdateCollectorStatusDto {
  @IsEnum(CollectorStatus)
  status!: CollectorStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
