import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { CollectorPortalService } from "./collector-portal.service";

/**
 * Fully public, unauthenticated lookup by booking slug — what a scanned QR
 * code or shared booking link resolves to. This is the first genuinely
 * public, enumerable-by-slug endpoint in the API, so it carries its own
 * rate limit (applied only here, not globally) rather than relying on any
 * existing guard.
 */
@Controller("public/collectors")
@UseGuards(ThrottlerGuard)
export class PublicCollectorsController {
  constructor(private readonly portal: CollectorPortalService) {}

  @Get(":slug")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  getBySlug(@Param("slug") slug: string) {
    return this.portal.getPublicProfileBySlug(slug);
  }
}
