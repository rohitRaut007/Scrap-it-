import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthUser } from "../auth/strategies/supabase-jwt.strategy";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { ListOrdersQueryDto } from "./dto/list-orders-query.dto";
import {
  ActiveOrderResponse,
  OrderListResponse,
  OrderResponse,
} from "./dto/order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get("status")
  status() {
    return { module: "orders", status: "stub" };
  }

  @Get()
  async list(
    @CurrentUser() user: AuthUser | undefined,
    @Query() query: ListOrdersQueryDto,
  ): Promise<OrderListResponse> {
    if (!user) throw new UnauthorizedException();
    return this.orders.list(user.id, query);
  }

  @Get("active")
  async active(
    @CurrentUser() user: AuthUser | undefined,
  ): Promise<ActiveOrderResponse> {
    if (!user) throw new UnauthorizedException();
    const data = await this.orders.getActive(user.id);
    return { data };
  }

  @Get(":id")
  async getById(
    @CurrentUser() user: AuthUser | undefined,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ): Promise<OrderResponse> {
    if (!user) throw new UnauthorizedException();
    const data = await this.orders.getById(user.id, id);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: CreateOrderDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ): Promise<OrderResponse> {
    if (!user) throw new UnauthorizedException();
    const trimmedKey = idempotencyKey?.trim();
    const data = await this.orders.create(
      user.id,
      dto,
      trimmedKey && trimmedKey.length > 0 ? trimmedKey : undefined,
    );
    return { data };
  }

  @Post(":id/cancel")
  async cancel(
    @CurrentUser() user: AuthUser | undefined,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: CancelOrderDto,
  ): Promise<OrderResponse> {
    if (!user) throw new UnauthorizedException();
    const data = await this.orders.cancel(user.id, id, dto);
    return { data };
  }
}
