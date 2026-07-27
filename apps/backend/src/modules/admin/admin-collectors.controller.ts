import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdminCollectorsService } from "./admin-collectors.service";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { UpdateCollectorStatusDto } from "./dto/update-collector-status.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminCollectorsController {
  constructor(private readonly adminCollectors: AdminCollectorsService) {}

  @Get("collectors")
  listCollectors(@Query() query: PaginationQueryDto) {
    return this.adminCollectors.listAll(query);
  }

  @Patch("collectors/:id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateCollectorStatusDto,
  ) {
    return this.adminCollectors.updateStatus(id, dto);
  }
}
