import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CategoriesService } from "./categories.service";
import { CategoryListResponse } from "./dto/category.dto";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get("status")
  status() {
    return { module: "categories", status: "stub" };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(): Promise<CategoryListResponse> {
    const data = await this.categories.list();
    return { data };
  }
}
