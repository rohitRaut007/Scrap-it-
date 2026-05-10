import { Controller, Get } from "@nestjs/common";

@Controller("pickups")
export class PickupsController {
  @Get("status")
  status() {
    return { module: "pickups", status: "stub" };
  }
}
