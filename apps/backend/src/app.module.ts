import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { PrismaModule } from "./database/prisma.module";
import { AppController } from "./app.controller";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PickupsModule } from "./modules/pickups/pickups.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { CollectorsModule } from "./modules/collectors/collectors.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AdminModule } from "./modules/admin/admin.module";
import { UploadsModule } from "./modules/uploads/uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PickupsModule,
    OrdersModule,
    CollectorsModule,
    CategoriesModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [RolesGuard],
})
export class AppModule {}
