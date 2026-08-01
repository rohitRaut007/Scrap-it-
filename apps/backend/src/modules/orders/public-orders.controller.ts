import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { GuestBookingDto } from "./dto/guest-booking.dto";
import { GuestBookingResponse } from "./dto/order.dto";
import { OrdersService } from "./orders.service";
import { SlugThrottlerGuard } from "./slug-throttler.guard";

// Tight in production (real anti-spam boundary); generous everywhere else
// so repeated local/staging testing against the same demo collector doesn't
// trip the same guard meant for anonymous internet traffic. Requires the
// deploy target to actually set NODE_ENV=production (standard practice).
const BOOKING_THROTTLE_LIMIT =
  process.env.NODE_ENV === "production" ? 5 : 100;

/**
 * Lets someone who scanned a collector's QR book a real pickup with no
 * account — the counterpart to `PublicCollectorsController`'s read-only
 * profile lookup, but a write, so it gets its own (much tighter) limit.
 */
@Controller("public/collectors")
@UseGuards(SlugThrottlerGuard)
export class PublicOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post(":slug/book")
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: BOOKING_THROTTLE_LIMIT, ttl: 3_600_000 } })
  async book(
    @Param("slug") slug: string,
    @Body() dto: GuestBookingDto,
  ): Promise<GuestBookingResponse> {
    const data = await this.orders.createGuestBooking(slug, dto);
    return { data };
  }
}
