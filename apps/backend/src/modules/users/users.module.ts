import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AddressesController } from "./addresses.controller";
import { AddressesService } from "./addresses.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [AuthModule],
  controllers: [UsersController, AddressesController],
  providers: [AddressesService],
})
export class UsersModule {}
