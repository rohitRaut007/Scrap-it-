import { IsUUID } from "class-validator";

export class AssignCollectorDto {
  @IsUUID("4")
  collectorId!: string;
}
