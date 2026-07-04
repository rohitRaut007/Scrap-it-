import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UploadsModule } from "../uploads/uploads.module";
import { AdminController } from "./admin.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminCollectorsController } from "./admin-collectors.controller";
import { AdminOrdersService } from "./admin-orders.service";
import { AdminCollectorsService } from "./admin-collectors.service";
import { RolesGuard } from "../../common/guards/roles.guard";

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [
    AdminController,
    AdminOrdersController,
    AdminCollectorsController,
  ],
  providers: [AdminOrdersService, AdminCollectorsService, RolesGuard],
})
export class AdminModule {}
