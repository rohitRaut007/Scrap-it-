import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CategoryDto } from "./dto/category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CategoryDto[]> {
    const rows = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      rateLabel: row.rateLabel,
      iconKey: row.iconKey,
    }));
  }
}
