import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UploadsModule } from "../uploads/uploads.module";
import { CollectorPortalService } from "./collector-portal.service";
import { CollectorsController } from "./collectors.controller";
import { PublicCollectorsController } from "./public-collectors.controller";

@Module({
  imports: [
    AuthModule,
    UploadsModule,
    NotificationsModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
  ],
  controllers: [CollectorsController, PublicCollectorsController],
  providers: [CollectorPortalService, RolesGuard],
  exports: [CollectorPortalService],
})
export class CollectorsModule {}
