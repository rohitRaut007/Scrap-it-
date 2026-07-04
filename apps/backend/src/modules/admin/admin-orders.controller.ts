import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthUser } from "../auth/strategies/supabase-jwt.strategy";
import { AdminOrdersService } from "./admin-orders.service";
import { AdminListOrdersQueryDto } from "./dto/admin-list-orders-query.dto";
import { AssignCollectorDto } from "./dto/assign-collector.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminOrdersController {
  constructor(private readonly adminOrders: AdminOrdersService) {}

  @Get("orders")
  listOrders(@Query() query: AdminListOrdersQueryDto) {
    return this.adminOrders.listAll(query);
  }

  @Get("orders/:id")
  getOrder(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    return this.adminOrders.getOrderById(id);
  }

  @Patch("orders/:id/status")
  updateStatus(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminOrders.updateStatus(id, dto, user.id);
  }

  @Post("orders/:id/assign")
  assignCollector(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: AssignCollectorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminOrders.assignCollector(id, dto, user.id);
  }

  @Get("stats")
  getStats() {
    return this.adminOrders.getStats();
  }
}
