import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
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
      createdAt: c.createdAt.toISOString(),
    }));

    return { data, page, pageSize, total };
  }
}
