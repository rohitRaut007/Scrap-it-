import { Controller, Get, UseGuards } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  @Get("ping")
  ping() {
    return { scope: "admin", ok: true };
  }
}
