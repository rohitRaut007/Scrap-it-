import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdminCollectorsService } from "./admin-collectors.service";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { UpdateCollectorStatusDto } from "./dto/update-collector-status.dto";
import { CreateCollectorDto } from "./dto/create-collector.dto";
import type { AuthUser } from "../auth/strategies/supabase-jwt.strategy";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminCollectorsController {
  constructor(private readonly adminCollectors: AdminCollectorsService) {}

  @Get("collectors")
  listCollectors(@Query() query: PaginationQueryDto) {
    return this.adminCollectors.listAll(query);
  }

  @Post("collectors")
  inviteCollector(
    @Body() dto: CreateCollectorDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.adminCollectors.inviteCollector(dto, admin.id);
  }

  @Patch("collectors/:id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateCollectorStatusDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.adminCollectors.updateStatus(id, dto, admin.id);
  }
}
