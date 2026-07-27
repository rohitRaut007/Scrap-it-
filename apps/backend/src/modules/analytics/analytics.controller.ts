import { Controller, Get, UseGuards } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthUser } from "../auth/strategies/supabase-jwt.strategy";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("status")
  status() {
    return { module: "analytics", status: "stub" };
  }

  /**
   * Customer-facing summary. `estimatedPayoutInr` is `null` (not a real
   * estimate) until pricing rules are defined — callers must not render it
   * as a numeric zero.
   */
  @Get("summary")
  @UseGuards(JwtAuthGuard)
  async summary(@CurrentUser() user: AuthUser) {
    const where = { customerId: user.id, status: OrderStatus.completed };

    const [pickupsCompleted, weightAgg] = await Promise.all([
      this.prisma.pickupOrder.count({ where }),
      this.prisma.pickupOrder.aggregate({
        where,
        _sum: { totalWeightKg: true },
      }),
    ]);

    const weightKgApprox = weightAgg._sum.totalWeightKg ?? 0;

    return {
      pickupsCompleted,
      weightKgApprox,
      estimatedPayoutInr: null as number | null,
    };
  }
}
