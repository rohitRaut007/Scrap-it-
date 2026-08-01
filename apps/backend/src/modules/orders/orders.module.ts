import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "../auth/auth.module";
import { CollectorsModule } from "../collectors/collectors.module";
import { UploadsModule } from "../uploads/uploads.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { PublicOrdersController } from "./public-orders.controller";
import { SlugThrottlerGuard } from "./slug-throttler.guard";

@Module({
  imports: [
    AuthModule,
    UploadsModule,
    CollectorsModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
  ],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService, SlugThrottlerGuard],
})
export class OrdersModule {}
