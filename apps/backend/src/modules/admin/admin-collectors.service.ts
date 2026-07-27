import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { UpdateCollectorStatusDto } from "./dto/update-collector-status.dto";
import {
  CollectorAdminDto,
  CollectorListResponse,
} from "./dto/admin-order.dto";

@Injectable()
export class AdminCollectorsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(query: PaginationQueryDto): Promise<CollectorListResponse> {
    const page = query.page;
    const pageSize = query.pageSize;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.collector.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.collector.count(),
    ]);

    const data: CollectorAdminDto[] = rows.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.user.name,
      email: c.user.email,
      phone: c.user.phone,
      vehicleInfo: c.vehicleInfo,
      rating: c.rating,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    }));

    return { data, page, pageSize, total };
  }

  async updateStatus(
    id: string,
    dto: UpdateCollectorStatusDto,
  ): Promise<{ ok: true }> {
    const existing = await this.prisma.collector.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Collector not found");

    await this.prisma.collector.update({
      where: { id },
      data: { status: dto.status },
    });
    return { ok: true };
  }
}
