import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class CompleteOrderItemDto {
  @IsUUID("4")
  categoryId!: string;

  @IsNumber()
  @Min(0.1)
  @Max(10000)
  weightKg!: number;
}

export class CompleteOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CompleteOrderItemDto)
  items!: CompleteOrderItemDto[];
}
