import { Controller, Get } from "@nestjs/common";

@Controller("collectors")
export class CollectorsController {
  @Get("status")
  status() {
    return { module: "collectors", status: "stub" };
  }
}
