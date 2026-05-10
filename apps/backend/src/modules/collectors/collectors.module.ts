import { Module } from "@nestjs/common";
import { CollectorsController } from "./collectors.controller";

@Module({
  controllers: [CollectorsController],
})
export class CollectorsModule {}
