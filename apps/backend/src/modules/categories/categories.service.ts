import { Injectable } from "@nestjs/common";
import { Category } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CategoryDto } from "./dto/category.dto";

// Categories effectively never change (no admin write endpoint exists for
// them today), but several read-heavy collector-portal endpoints
// (rate-card, public profile) each re-queried the full active list from
// scratch on every call. A short module-level cache removes that repeated
// round trip. TODO: invalidate once a category-edit endpoint exists.
const ACTIVE_CATEGORIES_CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class CategoriesService {
  private activeCache: { rows: Category[]; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Full active Category rows, cached for a few minutes at a time. */
  async listActiveCached(): Promise<Category[]> {
    if (this.activeCache && this.activeCache.expiresAt > Date.now()) {
      return this.activeCache.rows;
    }
    const rows = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    this.activeCache = {
      rows,
      expiresAt: Date.now() + ACTIVE_CATEGORIES_CACHE_TTL_MS,
    };
    return rows;
  }

  async list(): Promise<CategoryDto[]> {
    const rows = await this.listActiveCached();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      rateLabel: row.rateLabel,
      iconKey: row.iconKey,
    }));
  }
}
