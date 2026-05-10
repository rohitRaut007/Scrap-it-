import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthUser } from "../auth/strategies/supabase-jwt.strategy";
import { RequestOrderPhotoUploadDto } from "./dto/request-order-photo-upload.dto";
import { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /**
   * Customer-facing endpoint: server picks bucket + key
   * (`orders/{userId}/{ulid}.{ext}`) so callers cannot path-traverse or write
   * into other users' prefixes. Backed by Cloudflare R2 via S3-compatible API.
   */
  @Post("order-photo-url")
  @UseGuards(JwtAuthGuard)
  async requestOrderPhotoUpload(
    @CurrentUser() authUser: AuthUser | undefined,
    @Body() dto: RequestOrderPhotoUploadDto,
  ) {
    if (!authUser) {
      throw new UnauthorizedException();
    }
    const data = await this.uploads.createOrderPhotoUpload({
      userId: authUser.id,
      contentType: dto.contentType,
      contentLength: dto.contentLength,
    });
    return { data };
  }
}
