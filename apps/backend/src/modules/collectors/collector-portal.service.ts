import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  Address,
  Category,
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
import type { AuthUser } from "../auth/strategies/supabase-jwt.strategy";
import { CollectorOrdersQueryDto } from "./dto/collector-orders-query.dto";
import { CollectorUpdateStatusDto } from "./dto/collector-update-status.dto";
import { CompleteOrderDto } from "./dto/complete-order.dto";
import { UpdateCollectorProfileDto } from "./dto/update-collector-profile.dto";
import {
  CollectorEarningsDto,
  CollectorOrderDto,
  CollectorOrderListResponse,
  CollectorProfileDto,
  CollectorSummaryDto,
  EarningsDayDto,
} from "./dto/collector-portal.dto";

const BOOKING_BASE_URL = "https://scrapit.app/book";

/** Statuses the collector is actively working. */
const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.assigned,
  OrderStatus.en_route,
  OrderStatus.arriving,
];

/** Forward-only transitions a collector can perform via the status endpoint. */
const COLLECTOR_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.assigned]: [OrderStatus.en_route],
  [OrderStatus.en_route]: [OrderStatus.arriving],
};

/** Statuses from which the collector may complete (log weights). */
const COMPLETABLE_STATUSES: OrderStatus[] = [
  OrderStatus.en_route,
  OrderStatus.arriving,
];

const COLLECTOR_ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, phone: true } },
  address: true,
  categories: { include: { category: true } },
  photos: true,
  timeline: { orderBy: { occurredAt: "asc" as const } },
} satisfies Prisma.PickupOrderInclude;

type OrderWithRelations = PickupOrder & {
  customer: Pick<User, "id" | "name" | "phone">;
  address: Address;
  categories: (PickupOrderCategory & { category: Category })[];
  photos: PickupOrderPhoto[];
  timeline: PickupTimeline[];
};

type CollectorWithUser = Collector & { user: User };

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatAddressLine(address: Address): string {
  return [address.line1, address.line2, address.city, address.region]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(", ");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

@Injectable()
export class CollectorPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  /**
   * Resolve (or lazily provision) the Collector row for the logged-in user.
   * A user whose JWT carries role=collector may not have a Collector row yet
   * on first login — create it so onboarding is zero-touch.
   */
  async getOrCreateCollector(authUser: AuthUser): Promise<CollectorWithUser> {
    const existing = await this.prisma.collector.findUnique({
      where: { userId: authUser.id },
      include: { user: true },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({
      where: { id: authUser.id },
    });
    if (!user) throw new NotFoundException("User not found");

    const slug = await this.generateUniqueSlug(
      user.name ?? user.email.split("@")[0],
    );
    return this.prisma.collector.create({
      data: { userId: authUser.id, bookingSlug: slug },
      include: { user: true },
    });
  }

  private async generateUniqueSlug(base: string): Promise<string> {
    const root = slugify(base) || "collector";
    for (let i = 0; i < 20; i++) {
      const candidate = i === 0 ? root : `${root}-${i + 1}`;
      const clash = await this.prisma.collector.findUnique({
        where: { bookingSlug: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
    return `${root}-${Date.now().toString(36)}`;
  }

  async getProfile(authUser: AuthUser): Promise<CollectorProfileDto> {
    const collector = await this.getOrCreateCollector(authUser);
    const [totalCompleted, earnings] = await Promise.all([
      this.prisma.pickupOrder.count({
        where: { collectorId: collector.id, status: OrderStatus.completed },
      }),
      this.prisma.pickupOrder.aggregate({
        where: { collectorId: collector.id, status: OrderStatus.completed },
        _sum: { payoutInr: true },
      }),
    ]);
    return this.toProfileDto(collector, totalCompleted, earnings._sum.payoutInr ?? 0);
  }

  async updateProfile(
    authUser: AuthUser,
    dto: UpdateCollectorProfileDto,
  ): Promise<CollectorProfileDto> {
    const collector = await this.getOrCreateCollector(authUser);

    const userData: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) {
      userData.name = dto.name.trim() === "" ? null : dto.name.trim();
    }
    if (dto.phone !== undefined) {
      userData.phone = dto.phone.trim() === "" ? null : dto.phone.trim();
    }

    const collectorData: Prisma.CollectorUpdateInput = {};
    if (dto.vehicleInfo !== undefined) {
      collectorData.vehicleInfo =
        dto.vehicleInfo.trim() === "" ? null : dto.vehicleInfo.trim();
    }
    if (dto.serviceArea !== undefined) {
      collectorData.serviceArea =
        dto.serviceArea.trim() === "" ? null : dto.serviceArea.trim();
    }

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id: authUser.id }, data: userData });
      }
      if (Object.keys(collectorData).length > 0) {
        await tx.collector.update({
          where: { id: collector.id },
          data: collectorData,
        });
      }
    });

    return this.getProfile(authUser);
  }

  async getSummary(authUser: AuthUser): Promise<CollectorSummaryDto> {
    const collector = await this.getOrCreateCollector(authUser);
    const today = startOfToday();
    const weekStart = daysAgo(6);
    const monthStart = daysAgo(29);

    const [
      todayAgg,
      weekAgg,
      monthAgg,
      activeOrders,
      availableOrders,
      totalCompleted,
      nextOrderRow,
    ] = await Promise.all([
      this.prisma.pickupOrder.aggregate({
        where: {
          collectorId: collector.id,
          status: OrderStatus.completed,
          completedAt: { gte: today },
        },
        _sum: { payoutInr: true },
        _count: true,
      }),
      this.prisma.pickupOrder.aggregate({
        where: {
          collectorId: collector.id,
          status: OrderStatus.completed,
          completedAt: { gte: weekStart },
        },
        _sum: { payoutInr: true },
      }),
      this.prisma.pickupOrder.aggregate({
        where: {
          collectorId: collector.id,
          status: OrderStatus.completed,
          completedAt: { gte: monthStart },
        },
        _sum: { payoutInr: true },
      }),
      this.prisma.pickupOrder.count({
        where: { collectorId: collector.id, status: { in: ACTIVE_STATUSES } },
      }),
      this.prisma.pickupOrder.count({
        where: { status: OrderStatus.scheduled, collectorId: null },
      }),
      this.prisma.pickupOrder.count({
        where: { collectorId: collector.id, status: OrderStatus.completed },
      }),
      this.prisma.pickupOrder.findFirst({
        where: { collectorId: collector.id, status: { in: ACTIVE_STATUSES } },
        include: COLLECTOR_ORDER_INCLUDE,
        orderBy: { scheduledAt: "asc" },
      }),
    ]);

    return {
      todayEarningsInr: todayAgg._sum.payoutInr ?? 0,
      todayCompleted: todayAgg._count,
      weekEarningsInr: weekAgg._sum.payoutInr ?? 0,
      monthEarningsInr: monthAgg._sum.payoutInr ?? 0,
      activeOrders,
      availableOrders,
      nextOrder: nextOrderRow
        ? await this.toOrderDto(nextOrderRow as OrderWithRelations, collector.id)
        : null,
      rating: collector.rating,
      totalCompleted,
    };
  }

  /** Unclaimed scheduled orders — the incoming leads feed. */
  async listAvailable(
    authUser: AuthUser,
    page: number,
    pageSize: number,
  ): Promise<CollectorOrderListResponse> {
    const collector = await this.getOrCreateCollector(authUser);
    const where: Prisma.PickupOrderWhereInput = {
      status: OrderStatus.scheduled,
      collectorId: null,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pickupOrder.findMany({
        where,
        include: COLLECTOR_ORDER_INCLUDE,
        orderBy: { scheduledAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.pickupOrder.count({ where }),
    ]);
    const data = await Promise.all(
      rows.map((r) => this.toOrderDto(r as OrderWithRelations, collector.id)),
    );
    return { data, page, pageSize, total };
  }

  async listMine(
    authUser: AuthUser,
    query: CollectorOrdersQueryDto,
  ): Promise<CollectorOrderListResponse> {
    const collector = await this.getOrCreateCollector(authUser);
    const where: Prisma.PickupOrderWhereInput = { collectorId: collector.id };
    if (query.scope === "active") {
      where.status = { in: ACTIVE_STATUSES };
    } else if (query.scope === "history") {
      where.status = { in: [OrderStatus.completed, OrderStatus.cancelled] };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pickupOrder.findMany({
        where,
        include: COLLECTOR_ORDER_INCLUDE,
        orderBy:
          query.scope === "history"
            ? { updatedAt: "desc" }
            : { scheduledAt: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.pickupOrder.count({ where }),
    ]);
    const data = await Promise.all(
      rows.map((r) => this.toOrderDto(r as OrderWithRelations, collector.id)),
    );
    return { data, page: query.page, pageSize: query.pageSize, total };
  }

  /** Order detail: theirs, or any still-claimable order. */
  async getOrder(authUser: AuthUser, id: string): Promise<CollectorOrderDto> {
    const collector = await this.getOrCreateCollector(authUser);
    const row = await this.prisma.pickupOrder.findUnique({
      where: { id },
      include: COLLECTOR_ORDER_INCLUDE,
    });
    if (!row) throw new NotFoundException("Order not found");

    const isMine = row.collectorId === collector.id;
    const isClaimable =
      row.status === OrderStatus.scheduled && row.collectorId === null;
    if (!isMine && !isClaimable) {
      throw new ForbiddenException("This order belongs to another collector");
    }
    return this.toOrderDto(row as OrderWithRelations, collector.id);
  }

  /**
   * Claim an available order. Conditional update guards against two
   * collectors accepting the same order at once.
   */
  async accept(authUser: AuthUser, id: string): Promise<CollectorOrderDto> {
    const collector = await this.getOrCreateCollector(authUser);

    const claimed = await this.prisma.pickupOrder.updateMany({
      where: { id, status: OrderStatus.scheduled, collectorId: null },
      data: { collectorId: collector.id, status: OrderStatus.assigned },
    });
    if (claimed.count === 0) {
      const exists = await this.prisma.pickupOrder.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException("Order not found");
      throw new ConflictException(
        "This order was just taken by another collector",
      );
    }

    await this.prisma.pickupTimeline.create({
      data: {
        orderId: id,
        eventType: "assigned",
        metadata: {
          actorId: authUser.id,
          actorRole: "collector",
          collectorId: collector.id,
          selfAccepted: true,
        },
      },
    });

    return this.getOrder(authUser, id);
  }

  /** Hand an admin-assigned (not yet started) order back to the pool. */
  async decline(authUser: AuthUser, id: string): Promise<{ ok: true }> {
    const collector = await this.getOrCreateCollector(authUser);

    const released = await this.prisma.pickupOrder.updateMany({
      where: {
        id,
        collectorId: collector.id,
        status: OrderStatus.assigned,
      },
      data: { collectorId: null, status: OrderStatus.scheduled },
    });
    if (released.count === 0) {
      throw new UnprocessableEntityException(
        "Only orders still in 'assigned' state can be declined",
      );
    }

    await this.prisma.pickupTimeline.create({
      data: {
        orderId: id,
        eventType: "declined",
        metadata: {
          actorId: authUser.id,
          actorRole: "collector",
          collectorId: collector.id,
        },
      },
    });

    return { ok: true };
  }

  async updateStatus(
    authUser: AuthUser,
    id: string,
    dto: CollectorUpdateStatusDto,
  ): Promise<CollectorOrderDto> {
    const collector = await this.getOrCreateCollector(authUser);
    const order = await this.prisma.pickupOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.collectorId !== collector.id) {
      throw new ForbiddenException("This order is not assigned to you");
    }

    const allowed = COLLECTOR_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new UnprocessableEntityException(
        `Cannot transition from '${order.status}' to '${dto.status}'`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.pickupOrder.update({
        where: { id },
        data: { status: dto.status },
      }),
      this.prisma.pickupTimeline.create({
        data: {
          orderId: id,
          eventType: dto.status,
          metadata: {
            actorId: authUser.id,
            actorRole: "collector",
            previousStatus: order.status,
          },
        },
      }),
    ]);

    // TODO: Notify customer of status change (push / WhatsApp)

    return this.getOrder(authUser, id);
  }

  /**
   * Complete a pickup: log per-category weights, snapshot today's rates,
   * compute the payout, and mark the order completed — all in one transaction.
   */
  async complete(
    authUser: AuthUser,
    id: string,
    dto: CompleteOrderDto,
  ): Promise<CollectorOrderDto> {
    const collector = await this.getOrCreateCollector(authUser);
    const order = await this.prisma.pickupOrder.findUnique({
      where: { id },
      include: { categories: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.collectorId !== collector.id) {
      throw new ForbiddenException("This order is not assigned to you");
    }
    if (!COMPLETABLE_STATUSES.includes(order.status)) {
      throw new UnprocessableEntityException(
        `Cannot complete an order in '${order.status}' state`,
      );
    }

    // De-duplicate items by category (last entry wins).
    const itemByCategory = new Map(dto.items.map((i) => [i.categoryId, i]));
    const categoryIds = [...itemByCategory.keys()];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    if (categories.length !== categoryIds.length) {
      throw new UnprocessableEntityException("Unknown category in items");
    }

    const attached = new Set(order.categories.map((c) => c.categoryId));
    let totalWeightKg = 0;
    let payoutInr = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const category of categories) {
        const item = itemByCategory.get(category.id)!;
        const weightKg = Math.round(item.weightKg * 100) / 100;
        const linePayout = Math.round(weightKg * category.baseRateInr);
        totalWeightKg += weightKg;
        payoutInr += linePayout;

        const line = {
          weightKg,
          rateInrPerKg: category.baseRateInr,
          payoutInr: linePayout,
        };
        if (attached.has(category.id)) {
          await tx.pickupOrderCategory.update({
            where: {
              pickupOrderId_categoryId: {
                pickupOrderId: id,
                categoryId: category.id,
              },
            },
            data: line,
          });
        } else {
          // Material found on-site that wasn't in the booking — attach it.
          await tx.pickupOrderCategory.create({
            data: { pickupOrderId: id, categoryId: category.id, ...line },
          });
        }
      }

      totalWeightKg = Math.round(totalWeightKg * 100) / 100;

      await tx.pickupOrder.update({
        where: { id },
        data: {
          status: OrderStatus.completed,
          totalWeightKg,
          payoutInr,
          completedAt: new Date(),
        },
      });
      await tx.pickupTimeline.create({
        data: {
          orderId: id,
          eventType: "completed",
          metadata: {
            actorId: authUser.id,
            actorRole: "collector",
            previousStatus: order.status,
            totalWeightKg,
            payoutInr,
          },
        },
      });
    });

    // TODO: Notify customer: "Pickup completed. You earned ₹X"

    return this.getOrder(authUser, id);
  }

  async getEarnings(
    authUser: AuthUser,
    days: number,
  ): Promise<CollectorEarningsDto> {
    const collector = await this.getOrCreateCollector(authUser);
    const rangeStart = daysAgo(days - 1);
    const today = startOfToday();
    const weekStart = daysAgo(6);
    const monthStart = daysAgo(29);

    const [completedInRange, totals, recentRows] = await Promise.all([
      this.prisma.pickupOrder.findMany({
        where: {
          collectorId: collector.id,
          status: OrderStatus.completed,
          completedAt: { gte: rangeStart },
        },
        select: { completedAt: true, payoutInr: true, totalWeightKg: true },
      }),
      this.prisma.pickupOrder.aggregate({
        where: { collectorId: collector.id, status: OrderStatus.completed },
        _sum: { payoutInr: true, totalWeightKg: true },
        _count: true,
      }),
      this.prisma.pickupOrder.findMany({
        where: { collectorId: collector.id, status: OrderStatus.completed },
        include: COLLECTOR_ORDER_INCLUDE,
        orderBy: { completedAt: "desc" },
        take: 10,
      }),
    ]);

    const dayMap = new Map<string, EarningsDayDto>();
    for (let i = 0; i < days; i++) {
      const key = localDateKey(daysAgo(days - 1 - i));
      dayMap.set(key, { date: key, amountInr: 0, pickups: 0, weightKg: 0 });
    }

    let todayInr = 0;
    let weekInr = 0;
    let monthInr = 0;
    for (const row of completedInRange) {
      const amount = row.payoutInr ?? 0;
      const when = row.completedAt;
      if (!when) continue;
      const bucket = dayMap.get(localDateKey(when));
      if (bucket) {
        bucket.amountInr += amount;
        bucket.pickups += 1;
        bucket.weightKg += row.totalWeightKg ?? 0;
      }
      if (when >= today) todayInr += amount;
      if (when >= weekStart) weekInr += amount;
      if (when >= monthStart) monthInr += amount;
    }

    const recentOrders = await Promise.all(
      recentRows.map((r) =>
        this.toOrderDto(r as OrderWithRelations, collector.id),
      ),
    );

    return {
      todayInr,
      weekInr,
      monthInr,
      totalInr: totals._sum.payoutInr ?? 0,
      totalPickups: totals._count,
      totalWeightKg: Math.round((totals._sum.totalWeightKg ?? 0) * 100) / 100,
      days: [...dayMap.values()],
      recentOrders,
    };
  }

  private toProfileDto(
    collector: CollectorWithUser,
    totalCompleted: number,
    totalEarningsInr: number,
  ): CollectorProfileDto {
    return {
      id: collector.id,
      userId: collector.userId,
      name: collector.user.name,
      email: collector.user.email,
      phone: collector.user.phone,
      vehicleInfo: collector.vehicleInfo,
      serviceArea: collector.serviceArea,
      rating: collector.rating,
      bookingSlug: collector.bookingSlug,
      bookingUrl: collector.bookingSlug
        ? `${BOOKING_BASE_URL}/${collector.bookingSlug}`
        : null,
      totalCompleted,
      totalEarningsInr,
      memberSince: collector.createdAt.toISOString(),
    };
  }

  private async toOrderDto(
    order: OrderWithRelations,
    viewerCollectorId: string,
  ): Promise<CollectorOrderDto> {
    const isMine = order.collectorId === viewerCollectorId;
    const isAvailable =
      order.status === OrderStatus.scheduled && order.collectorId === null;

    const photoUrls = (
      await Promise.all(
        order.photos.map((p) => this.uploads.getOrderPhotoReadUrl(p.storageKey)),
      )
    ).filter((u): u is string => typeof u === "string");

    return {
      id: order.id,
      status: order.status,
      scheduledAt: order.scheduledAt.toISOString(),
      createdAt: order.createdAt.toISOString(),
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      etaMinutes: order.etaMinutes ?? null,
      totalWeightKg: order.totalWeightKg ?? null,
      payoutInr: order.payoutInr ?? null,
      notes: order.notes,
      addressLine: formatAddressLine(order.address),
      city: order.address.city,
      latitude: order.address.latitude ?? null,
      longitude: order.address.longitude ?? null,
      categories: order.categories.map((c) => ({
        categoryId: c.categoryId,
        name: c.category.name,
        rateLabel: c.category.rateLabel,
        baseRateInr: c.category.baseRateInr,
        weightKg: c.weightKg ?? null,
        rateInrPerKg: c.rateInrPerKg ?? null,
        payoutInr: c.payoutInr ?? null,
      })),
      photoUrls,
      customerName: order.customer.name,
      // Contact details stay hidden until the order is actually theirs.
      customerPhone: isMine ? order.customer.phone : null,
      timeline: order.timeline.map((t) => ({
        eventType: t.eventType,
        occurredAt: t.occurredAt.toISOString(),
      })),
      isAvailable,
    };
  }
}
