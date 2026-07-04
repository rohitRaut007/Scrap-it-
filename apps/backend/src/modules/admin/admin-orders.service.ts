import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  Address,
  Collector,
  OrderStatus,
  PickupOrder,
  PickupOrderCategory,
  PickupOrderPhoto,
  PickupTimeline,
  Prisma,
  User,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { AdminListOrdersQueryDto } from "./dto/admin-list-orders-query.dto";
import { AssignCollectorDto } from "./dto/assign-collector.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import {
  AdminOrderDto,
  AdminOrderListResponse,
  AdminStatsDto,
  AdminTimelineEntryDto,
  CollectorInfoDto,
} from "./dto/admin-order.dto";

// Valid status transitions for admin actions.
// scheduled → assigned happens ONLY via the assign endpoint.
// completed and cancelled are terminal — no next states.
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.scheduled]: [OrderStatus.cancelled],
  [OrderStatus.assigned]: [OrderStatus.en_route, OrderStatus.cancelled],
  [OrderStatus.en_route]: [OrderStatus.arriving],
  [OrderStatus.arriving]: [OrderStatus.completed],
};

// Statuses that allow collector (re)assignment.
const ASSIGNABLE_STATUSES: OrderStatus[] = [
  OrderStatus.scheduled,
  OrderStatus.assigned,
];

const ADMIN_ORDER_INCLUDE = {
  customer: { select: { id: true, email: true, name: true, phone: true } },
  collector: {
    include: { user: { select: { id: true, name: true, phone: true } } },
  },
  address: true,
  categories: { include: { category: true } },
  photos: true,
  timeline: { orderBy: { occurredAt: "asc" as const } },
} satisfies Prisma.PickupOrderInclude;

type AdminOrderWithRelations = PickupOrder & {
  customer: Pick<User, "id" | "email" | "name" | "phone">;
  collector:
    | (Collector & { user: Pick<User, "id" | "name" | "phone"> })
    | null;
  address: Address;
  categories: (PickupOrderCategory & {
    category: { id: string; name: string };
  })[];
  photos: PickupOrderPhoto[];
  timeline: PickupTimeline[];
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatAddressLine(address: Address): string {
  return [address.line1, address.line2, address.city, address.region]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(", ");
}

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async listAll(query: AdminListOrdersQueryDto): Promise<AdminOrderListResponse> {
    const where: Prisma.PickupOrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    const page = query.page;
    const pageSize = query.pageSize;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pickupOrder.findMany({
        where,
        include: ADMIN_ORDER_INCLUDE,
        orderBy: { scheduledAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.pickupOrder.count({ where }),
    ]);

    const data = await Promise.all(
      rows.map((row) => this.toAdminDto(row as AdminOrderWithRelations)),
    );
    return { data, page, pageSize, total };
  }

  async getOrderById(id: string): Promise<AdminOrderDto> {
    const row = await this.prisma.pickupOrder.findUnique({
      where: { id },
      include: ADMIN_ORDER_INCLUDE,
    });
    if (!row) throw new NotFoundException("Order not found");
    return this.toAdminDto(row as AdminOrderWithRelations);
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actorId: string,
  ): Promise<AdminOrderDto> {
    const order = await this.prisma.pickupOrder.findUnique({
      where: { id },
      include: ADMIN_ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException("Order not found");

    if (order.status === OrderStatus.cancelled) {
      throw new UnprocessableEntityException("Order is already cancelled");
    }
    if (order.status === OrderStatus.completed) {
      throw new UnprocessableEntityException("Completed orders cannot be updated");
    }

    // Block the scheduled → assigned path here — use the assign endpoint instead.
    if (
      order.status === OrderStatus.scheduled &&
      dto.status === OrderStatus.assigned
    ) {
      throw new UnprocessableEntityException(
        "Use the assign endpoint to assign a collector to this order",
      );
    }

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new UnprocessableEntityException(
        `Cannot transition from '${order.status}' to '${dto.status}'`,
      );
    }

    const isCompleting = dto.status === OrderStatus.completed;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.pickupOrder.update({
        where: { id },
        data: {
          status: dto.status,
          ...(isCompleting ? { completedAt: new Date() } : {}),
          ...(isCompleting && dto.totalWeightKg != null
            ? { totalWeightKg: dto.totalWeightKg }
            : {}),
          ...(dto.status === OrderStatus.cancelled
            ? { cancelledAt: new Date() }
            : {}),
        },
        include: ADMIN_ORDER_INCLUDE,
      });
      await tx.pickupTimeline.create({
        data: {
          orderId: id,
          eventType: dto.status,
          metadata: {
            actorId,
            actorRole: "admin",
            previousStatus: order.status,
            ...(isCompleting && dto.totalWeightKg != null
              ? { totalWeightKg: dto.totalWeightKg }
              : {}),
          },
        },
      });
      return row;
    });

    // TODO: Send push notification to customer on status change
    // e.g. this.notifications.notifyOrderStatusChange(updated.customerId, dto.status)

    return this.toAdminDto(updated as AdminOrderWithRelations);
  }

  async assignCollector(
    id: string,
    dto: AssignCollectorDto,
    actorId: string,
  ): Promise<AdminOrderDto> {
    const order = await this.prisma.pickupOrder.findUnique({
      where: { id },
      include: ADMIN_ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException("Order not found");

    if (!ASSIGNABLE_STATUSES.includes(order.status)) {
      throw new UnprocessableEntityException(
        `Cannot assign a collector to an order with status '${order.status}'`,
      );
    }

    const collector = await this.prisma.collector.findUnique({
      where: { id: dto.collectorId },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
    if (!collector) throw new NotFoundException("Collector not found");

    const isReassignment =
      order.collectorId != null && order.collectorId !== dto.collectorId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.pickupOrder.update({
        where: { id },
        data: {
          collectorId: dto.collectorId,
          status: OrderStatus.assigned,
        },
        include: ADMIN_ORDER_INCLUDE,
      });
      await tx.pickupTimeline.create({
        data: {
          orderId: id,
          eventType: "assigned",
          metadata: {
            actorId,
            actorRole: "admin",
            collectorId: dto.collectorId,
            ...(isReassignment
              ? { previousCollectorId: order.collectorId }
              : {}),
          },
        },
      });
      return row;
    });

    // TODO: Send push notification to customer that a collector has been assigned

    return this.toAdminDto(updated as AdminOrderWithRelations);
  }

  async getStats(): Promise<AdminStatsDto> {
    const allStatuses: OrderStatus[] = [
      OrderStatus.scheduled,
      OrderStatus.assigned,
      OrderStatus.en_route,
      OrderStatus.arriving,
      OrderStatus.completed,
      OrderStatus.cancelled,
    ];

    const today = startOfToday();

    // Run one count per status + today count + collector count in parallel.
    const [statusCounts, todayNewOrders, totalCollectors] = await Promise.all([
      Promise.all(
        allStatuses.map((s) =>
          this.prisma.pickupOrder.count({ where: { status: s } }),
        ),
      ),
      this.prisma.pickupOrder.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.collector.count(),
    ]);

    const byStatus: Record<string, number> = {};
    allStatuses.forEach((s, i) => {
      byStatus[s] = statusCounts[i];
    });

    return { byStatus, todayNewOrders, totalCollectors };
  }

  private async toAdminDto(
    order: AdminOrderWithRelations,
  ): Promise<AdminOrderDto> {
    const photoUrls = (
      await Promise.all(
        order.photos.map((p) =>
          this.uploads.getOrderPhotoReadUrl(p.storageKey),
        ),
      )
    ).filter((u): u is string => typeof u === "string");

    const collectorInfo: CollectorInfoDto | null = order.collector
      ? {
          id: order.collector.id,
          userId: order.collector.userId,
          name: order.collector.user.name,
          phone: order.collector.user.phone,
          vehicleInfo: order.collector.vehicleInfo,
          rating: order.collector.rating,
        }
      : null;

    const timeline: AdminTimelineEntryDto[] = order.timeline.map((t) => ({
      eventType: t.eventType,
      occurredAt: t.occurredAt.toISOString(),
      metadata: t.metadata,
    }));

    return {
      id: order.id,
      status: order.status,
      categoryIds: order.categories.map((c) => c.categoryId),
      categoryNames: order.categories.map((c) => c.category.name),
      scheduledAt: order.scheduledAt.toISOString(),
      etaMinutes: order.etaMinutes ?? null,
      addressId: order.addressId,
      addressLine: formatAddressLine(order.address),
      totalWeightKg: order.totalWeightKg ?? null,
      photoUrls,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      customerId: order.customerId,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      customerEmail: order.customer.email,
      collectorInfo,
      timeline,
    };
  }
}
