import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * Keys the rate limit on IP + the `:slug` route param instead of IP alone.
 * Guest bookings are a real DB write from anonymous traffic — plain
 * per-IP throttling would let one spammer exhaust their whole budget
 * against a single collector while leaving every other collector's page
 * untouched by the same visitor. Keying on both bounds abuse per collector
 * without being any more permissive overall.
 */
@Injectable()
export class SlugThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const params = req.params as Record<string, string> | undefined;
    const slug = params?.slug ?? "unknown";
    return `${req.ip as string}:${slug}`;
  }
}
