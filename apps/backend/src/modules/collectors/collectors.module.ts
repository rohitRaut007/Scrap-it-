import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthModule } from "../auth/auth.module";
import { UploadsModule } from "../uploads/uploads.module";
import { CollectorPortalService } from "./collector-portal.service";
import { CollectorsController } from "./collectors.controller";

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [CollectorsController],
  providers: [CollectorPortalService, RolesGuard],
})
export class CollectorsModule {}
