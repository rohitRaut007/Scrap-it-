import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthModule } from "../auth/auth.module";
import { CollectorsModule } from "../collectors/collectors.module";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";

@Module({
  imports: [AuthModule, CollectorsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, RolesGuard],
})
export class InvoicesModule {}
