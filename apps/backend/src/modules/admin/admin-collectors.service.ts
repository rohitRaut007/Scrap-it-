import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { UpdateCollectorStatusDto } from "./dto/update-collector-status.dto";
import { CreateCollectorDto } from "./dto/create-collector.dto";
import { CollectorInviteResponseDto } from "./dto/collector-invite-response.dto";
import { SupabaseAdminService } from "./supabase-admin.service";
import {
  CollectorAdminDto,
  CollectorListResponse,
} from "./dto/admin-order.dto";

@Injectable()
export class AdminCollectorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

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

    const data: CollectorAdminDto[] = rows.map((c) => this.toAdminDto(c));

    return { data, page, pageSize, total };
  }

  async inviteCollector(
    dto: CreateCollectorDto,
    actingAdminId: string,
  ): Promise<CollectorInviteResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, role: true },
    });
    if (existingUser && existingUser.role !== "collector") {
      throw new ConflictException(
        "This email is already registered as a different account type",
      );
    }

    const tempPassword = this.supabaseAdmin.generateTempPassword();
    const { id: userId, isNewUser } =
      await this.supabaseAdmin.createOrUpdateAuthUser({
        email: dto.email,
        password: tempPassword,
        name: dto.name,
      });

    await this.prisma.user.upsert({
      where: { id: userId },
      update: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        role: "collector",
      },
      create: {
        id: userId,
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        role: "collector",
      },
    });

    const collector = await this.prisma.collector.upsert({
      where: { userId },
      update: { vehicleInfo: dto.vehicleInfo, status: "active" },
      create: { userId, vehicleInfo: dto.vehicleInfo, status: "active" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    const isReactivation = !isNewUser;
    await this.writeAuditLog(
      actingAdminId,
      isReactivation ? "collector.reinvited" : "collector.invited",
      collector.id,
      { email: dto.email, isNewUser },
    );

    return {
      collector: this.toAdminDto(collector),
      tempPassword,
      isReactivation,
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateCollectorStatusDto,
    actingAdminId: string,
  ): Promise<{ ok: true }> {
    const existing = await this.prisma.collector.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException("Collector not found");

    await this.prisma.collector.update({
      where: { id },
      data: { status: dto.status },
    });

    const action =
      dto.status === "removed"
        ? "collector.removed"
        : "collector.status_changed";
    await this.writeAuditLog(actingAdminId, action, id, {
      from: existing.status,
      to: dto.status,
      reason: dto.reason ?? null,
    });

    return { ok: true };
  }

  private async writeAuditLog(
    adminUserId: string,
    action: string,
    targetCollectorId: string,
    metadata: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: { adminUserId, action, targetCollectorId, metadata },
    });
  }

  private toAdminDto(c: {
    id: string;
    userId: string;
    vehicleInfo: string | null;
    rating: number | null;
    status: CollectorAdminDto["status"];
    createdAt: Date;
    user: { name: string | null; email: string; phone: string | null };
  }): CollectorAdminDto {
    return {
      id: c.id,
      userId: c.userId,
      name: c.user.name,
      email: c.user.email,
      phone: c.user.phone,
      vehicleInfo: c.vehicleInfo,
      rating: c.rating,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    };
  }
}
