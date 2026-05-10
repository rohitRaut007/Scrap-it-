import { IsIn, IsInt, IsString, Max, Min } from "class-validator";

const MAX_BYTES = 10 * 1024 * 1024;

export class RequestOrderPhotoUploadDto {
  @IsString()
  @IsIn(["image/jpeg", "image/png", "image/webp"])
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_BYTES)
  contentLength!: number;
}
