import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UploadsModule } from "../uploads/uploads.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
