import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthUser } from "../auth/strategies/supabase-jwt.strategy";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { CollectorPortalService } from "./collector-portal.service";
import { CollectorOrdersQueryDto } from "./dto/collector-orders-query.dto";
import { CollectorUpdateStatusDto } from "./dto/collector-update-status.dto";
import { CompleteOrderDto } from "./dto/complete-order.dto";
import { LogPickupDto } from "./dto/log-pickup.dto";
import { UpdateCollectorProfileDto } from "./dto/update-collector-profile.dto";
import { UpsertRateCardDto } from "./dto/upsert-rate-card.dto";

@Controller("collectors")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("collector")
export class CollectorsController {
  constructor(private readonly portal: CollectorPortalService) {}

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.portal.getProfile(user);
  }

  @Patch("me")
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCollectorProfileDto,
  ) {
    return this.portal.updateProfile(user, dto);
  }

  @Get("me/summary")
  summary(@CurrentUser() user: AuthUser) {
    return this.portal.getSummary(user);
  }

  @Get("me/available-orders")
  available(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.portal.listAvailable(user, query.page, query.pageSize);
  }

  @Get("me/orders")
  myOrders(
    @CurrentUser() user: AuthUser,
    @Query() query: CollectorOrdersQueryDto,
  ) {
    return this.portal.listMine(user, query);
  }

  @Get("me/orders/:id")
  order(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.portal.getOrder(user, id);
  }

  @Post("me/orders/:id/accept")
  accept(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.portal.accept(user, id);
  }

  @Post("me/orders/:id/decline")
  decline(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.portal.decline(user, id);
  }

  @Patch("me/orders/:id/status")
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CollectorUpdateStatusDto,
  ) {
    return this.portal.updateStatus(user, id, dto);
  }

  @Post("me/orders/:id/complete")
  complete(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CompleteOrderDto,
  ) {
    return this.portal.complete(user, id, dto);
  }

  @Post("me/orders/:id/receipt-number")
  assignOrderReceiptNumber(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.portal.getOrAssignOrderReceiptNumber(user, id);
  }

  @Get("me/earnings")
  earnings(
    @CurrentUser() user: AuthUser,
    @Query("days", new ParseIntPipe({ optional: true })) days?: number,
  ) {
    const clamped = Math.min(Math.max(days ?? 30, 7), 90);
    return this.portal.getEarnings(user, clamped);
  }

  @Post("me/pickup-logs")
  logPickup(@CurrentUser() user: AuthUser, @Body() dto: LogPickupDto) {
    return this.portal.logPickup(user, dto);
  }

  @Post("me/pickup-logs/:id/receipt-number")
  assignLogReceiptNumber(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.portal.getOrAssignLogReceiptNumber(user, id);
  }

  @Get("me/rate-card")
  rateCard(@CurrentUser() user: AuthUser) {
    return this.portal.getRateCard(user);
  }

  @Put("me/rate-card")
  setRateCard(@CurrentUser() user: AuthUser, @Body() dto: UpsertRateCardDto) {
    return this.portal.setRateCard(user, dto);
  }
}
