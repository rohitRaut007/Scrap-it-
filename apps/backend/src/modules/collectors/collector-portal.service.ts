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
  PickupLog,
  PickupLogCategory,
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
import { LogPickupDto } from "./dto/log-pickup.dto";
import { UpdateCollectorProfileDto } from "./dto/update-collector-profile.dto";
import {
  CollectorEarningsDto,
  CollectorOrderDto,
  CollectorOrderListResponse,
  CollectorProfileDto,
  CollectorRateCardItemDto,
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

type LogWithRelations = PickupLog & {
  categories: (PickupLogCategory & { category: Category })[];
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
    const [orderCompleted, orderEarnings, logCount, logEarnings] =
      await Promise.all([
        this.prisma.pickupOrder.count({
          where: { collectorId: collector.id, status: OrderStatus.completed },
        }),
        this.prisma.pickupOrder.aggregate({
          where: { collectorId: collector.id, status: OrderStatus.completed },
          _sum: { payoutInr: true },
        }),
        this.prisma.pickupLog.count({ where: { collectorId: collector.id } }),
        this.prisma.pickupLog.aggregate({
          where: { collectorId: collector.id },
          _sum: { payoutInr: true },
        }),
      ]);
    return this.toProfileDto(
      collector,
      orderCompleted + logCount,
      (orderEarnings._sum.payoutInr ?? 0) + (logEarnings._sum.payoutInr ?? 0),
    );
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

    // Fetch each table's last-30-days rows ONCE and bucket today/week/month
    // sums in JS, instead of issuing 3 separate aggregate queries per table
    // (6 round trips) for what's really one date-bounded scan. Cuts this
    // endpoint from 11 concurrent queries to 7 — fewer connections the
    // pool needs to serve at once.
    const [
      ordersInRange,
      activeOrders,
      availableOrders,
      totalCompleted,
      nextOrderRow,
      logsInRange,
      logTotalCount,
    ] = await Promise.all([
      this.prisma.pickupOrder.findMany({
        where: {
          collectorId: collector.id,
          status: OrderStatus.completed,
          completedAt: { gte: monthStart },
        },
        select: { completedAt: true, payoutInr: true },
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
        relationLoadStrategy: "join",
        orderBy: { scheduledAt: "asc" },
      }),
      // Manually logged pickups count toward earnings exactly like app orders.
      this.prisma.pickupLog.findMany({
        where: { collectorId: collector.id, loggedAt: { gte: monthStart } },
        select: { loggedAt: true, payoutInr: true },
      }),
      this.prisma.pickupLog.count({ where: { collectorId: collector.id } }),
    ]);

    let todayEarningsInr = 0;
    let todayCompleted = 0;
    let weekEarningsInr = 0;
    let monthEarningsInr = 0;
    const bucket = (when: Date, amount: number) => {
      monthEarningsInr += amount;
      if (when >= weekStart) weekEarningsInr += amount;
      if (when >= today) {
        todayEarningsInr += amount;
        todayCompleted += 1;
      }
    };
    for (const row of ordersInRange) {
      if (row.completedAt) bucket(row.completedAt, row.payoutInr ?? 0);
    }
    for (const row of logsInRange) {
      bucket(row.loggedAt, row.payoutInr ?? 0);
    }

    return {
      todayEarningsInr,
      todayCompleted,
      weekEarningsInr,
      monthEarningsInr,
      activeOrders,
      availableOrders,
      nextOrder: nextOrderRow
        ? await this.toOrderDto(nextOrderRow as OrderWithRelations, collector.id)
        : null,
      rating: collector.rating,
      totalCompleted: totalCompleted + logTotalCount,
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
        relationLoadStrategy: "join",
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

    // A manual log is never "active" — only merge it into history/all.
    if (query.scope === "active") {
      const [rows, total] = await this.prisma.$transaction([
        this.prisma.pickupOrder.findMany({
          where,
          include: COLLECTOR_ORDER_INCLUDE,
          relationLoadStrategy: "join",
          orderBy: { scheduledAt: "asc" },
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

    // history/all: merge PickupOrder + PickupLog, sorted by effective date desc.
    // Pragmatic in-memory merge (over-fetch each source, sort, slice) rather
    // than a SQL UNION — correct at single-collector scale; revisit with a
    // raw-SQL union view if pagination depth ever becomes a bottleneck.
    const windowEnd = query.page * query.pageSize;
    const [orderRows, orderTotal, logRows, logTotal] = await Promise.all([
      this.prisma.pickupOrder.findMany({
        where,
        include: COLLECTOR_ORDER_INCLUDE,
        relationLoadStrategy: "join",
        orderBy: { updatedAt: "desc" },
        take: windowEnd,
      }),
      this.prisma.pickupOrder.count({ where }),
      this.prisma.pickupLog.findMany({
        where: { collectorId: collector.id },
        include: { categories: { include: { category: true } } },
        relationLoadStrategy: "join",
        orderBy: { loggedAt: "desc" },
        take: windowEnd,
      }),
      this.prisma.pickupLog.count({ where: { collectorId: collector.id } }),
    ]);

    // Sort by each row's own "last touched" date (DB updatedAt / loggedAt) —
    // NOT the DTO's scheduledAt, which for orders is the booking time and
    // can differ from when the pickup actually completed or was cancelled.
    const orderTuples = await Promise.all(
      orderRows.map(async (r) => ({
        date: r.updatedAt,
        dto: await this.toOrderDto(r as OrderWithRelations, collector.id),
      })),
    );
    const logTuples = logRows.map((r) => ({
      date: r.loggedAt,
      dto: this.toLogOrderDto(r as LogWithRelations),
    }));

    const merged = [...orderTuples, ...logTuples].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    const start = (query.page - 1) * query.pageSize;
    const data = merged.slice(start, start + query.pageSize).map((t) => t.dto);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total: orderTotal + logTotal,
    };
  }

  /** Order detail: theirs, or any still-claimable order. */
  async getOrder(authUser: AuthUser, id: string): Promise<CollectorOrderDto> {
    const collector = await this.getOrCreateCollector(authUser);
    return this.getOrderForCollector(collector.id, id);
  }

  /**
   * Same as getOrder(), but takes an already-resolved collector id — used at
   * the end of mutations (accept/updateStatus/complete) that already looked
   * the collector up once, so we don't repeat that DB round trip just to
   * build the response.
   */
  private async getOrderForCollector(
    collectorId: string,
    id: string,
  ): Promise<CollectorOrderDto> {
    const row = await this.prisma.pickupOrder.findUnique({
      where: { id },
      include: COLLECTOR_ORDER_INCLUDE,
      relationLoadStrategy: "join",
    });
    if (!row) throw new NotFoundException("Order not found");

    const isMine = row.collectorId === collectorId;
    const isClaimable =
      row.status === OrderStatus.scheduled && row.collectorId === null;
    if (!isMine && !isClaimable) {
      throw new ForbiddenException("This order belongs to another collector");
    }
    return this.toOrderDto(row as OrderWithRelations, collectorId);
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

    return this.getOrderForCollector(collector.id, id);
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
    // Fetch with full relations up front so we can build the response by
    // patching this object in-memory afterward — avoids a second
    // round trip to re-fetch the same row just to reflect one changed field.
    const order = await this.prisma.pickupOrder.findUnique({
      where: { id },
      include: COLLECTOR_ORDER_INCLUDE,
      relationLoadStrategy: "join",
    });
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

    const [, timelineRow] = await this.prisma.$transaction([
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

    return this.toOrderDto(
      {
        ...order,
        status: dto.status,
        timeline: [...order.timeline, timelineRow],
      } as OrderWithRelations,
      collector.id,
    );
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

    // Pure computation — no need to hold a DB connection for this part.
    const categoryLines = categories.map((category) => {
      const item = itemByCategory.get(category.id)!;
      const weightKg = Math.round(item.weightKg * 100) / 100;
      return {
        categoryId: category.id,
        weightKg,
        rateInrPerKg: category.baseRateInr,
        payoutInr: Math.round(weightKg * category.baseRateInr),
        isNew: !attached.has(category.id),
      };
    });
    const totalWeightKg =
      Math.round(categoryLines.reduce((s, l) => s + l.weightKg, 0) * 100) / 100;
    const payoutInr = categoryLines.reduce((s, l) => s + l.payoutInr, 0);
    const previousStatus = order.status;

    await this.prisma.$transaction(async (tx) => {
      // Independent per-category writes — run concurrently over the same
      // transaction connection instead of awaiting one at a time.
      await Promise.all(
        categoryLines.map((line) =>
          line.isNew
            ? tx.pickupOrderCategory.create({
                data: {
                  pickupOrderId: id,
                  categoryId: line.categoryId,
                  weightKg: line.weightKg,
                  rateInrPerKg: line.rateInrPerKg,
                  payoutInr: line.payoutInr,
                },
              })
            : tx.pickupOrderCategory.update({
                where: {
                  pickupOrderId_categoryId: {
                    pickupOrderId: id,
                    categoryId: line.categoryId,
                  },
                },
                data: {
                  weightKg: line.weightKg,
                  rateInrPerKg: line.rateInrPerKg,
                  payoutInr: line.payoutInr,
                },
              }),
        ),
      );

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
            previousStatus,
            totalWeightKg,
            payoutInr,
          },
        },
      });
    });

    // TODO: Notify customer: "Pickup completed. You earned ₹X"

    return this.getOrderForCollector(collector.id, id);
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

    const [
      completedInRange,
      totals,
      recentRows,
      logsInRange,
      logTotals,
      recentLogRows,
    ] = await Promise.all([
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
        relationLoadStrategy: "join",
        orderBy: { completedAt: "desc" },
        take: 10,
      }),
      // Manually logged pickups feed the same chart/totals as app orders.
      this.prisma.pickupLog.findMany({
        where: { collectorId: collector.id, loggedAt: { gte: rangeStart } },
        select: { loggedAt: true, payoutInr: true, totalWeightKg: true },
      }),
      this.prisma.pickupLog.aggregate({
        where: { collectorId: collector.id },
        _sum: { payoutInr: true, totalWeightKg: true },
        _count: true,
      }),
      this.prisma.pickupLog.findMany({
        where: { collectorId: collector.id },
        include: { categories: { include: { category: true } } },
        orderBy: { loggedAt: "desc" },
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
    const bucketRow = (when: Date | null, amount: number, weightKg: number) => {
      if (!when) return;
      const bucket = dayMap.get(localDateKey(when));
      if (bucket) {
        bucket.amountInr += amount;
        bucket.pickups += 1;
        bucket.weightKg += weightKg;
      }
      if (when >= today) todayInr += amount;
      if (when >= weekStart) weekInr += amount;
      if (when >= monthStart) monthInr += amount;
    };
    for (const row of completedInRange) {
      bucketRow(row.completedAt, row.payoutInr ?? 0, row.totalWeightKg ?? 0);
    }
    for (const row of logsInRange) {
      bucketRow(row.loggedAt, row.payoutInr ?? 0, row.totalWeightKg ?? 0);
    }

    const recentOrderTuples = await Promise.all(
      recentRows.map(async (r) => ({
        date: r.completedAt ?? r.updatedAt,
        dto: await this.toOrderDto(r as OrderWithRelations, collector.id),
      })),
    );
    const recentLogTuples = recentLogRows.map((r) => ({
      date: r.loggedAt,
      dto: this.toLogOrderDto(r as LogWithRelations),
    }));
    const recentOrders = [...recentOrderTuples, ...recentLogTuples]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10)
      .map((t) => t.dto);

    return {
      todayInr,
      weekInr,
      monthInr,
      totalInr:
        (totals._sum.payoutInr ?? 0) + (logTotals._sum.payoutInr ?? 0),
      totalPickups: totals._count + logTotals._count,
      totalWeightKg:
        Math.round(
          ((totals._sum.totalWeightKg ?? 0) +
            (logTotals._sum.totalWeightKg ?? 0)) *
            100,
        ) / 100,
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
      source: "app",
    };
  }

  /**
   * Log a pickup for the collector's own existing customer, found outside
   * the app. Never assigned, claimable, or visible to any other collector —
   * `PickupLog` has no status/collectorId-null "unclaimed" state at all, so
   * that's true by construction, not a filter to remember.
   */
  async logPickup(
    authUser: AuthUser,
    dto: LogPickupDto,
  ): Promise<CollectorOrderDto> {
    const collector = await this.getOrCreateCollector(authUser);

    // De-duplicate items by category (last entry wins) — same as complete().
    const itemByCategory = new Map(dto.items.map((i) => [i.categoryId, i]));
    const categoryIds = [...itemByCategory.keys()];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    if (categories.length !== categoryIds.length) {
      throw new UnprocessableEntityException("Unknown category in items");
    }

    let totalWeightKg = 0;
    let payoutInr = 0;
    const categoryLines = categories.map((category) => {
      const item = itemByCategory.get(category.id)!;
      const weightKg = Math.round(item.weightKg * 100) / 100;
      const linePayout = Math.round(weightKg * category.baseRateInr);
      totalWeightKg += weightKg;
      payoutInr += linePayout;
      return {
        categoryId: category.id,
        weightKg,
        rateInrPerKg: category.baseRateInr,
        payoutInr: linePayout,
      };
    });
    totalWeightKg = Math.round(totalWeightKg * 100) / 100;

    const created = await this.prisma.pickupLog.create({
      data: {
        collectorId: collector.id,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone?.trim() || null,
        addressText: dto.addressText?.trim() || null,
        notes: dto.notes?.trim() || null,
        totalWeightKg,
        payoutInr,
        categories: { create: categoryLines },
      },
      include: { categories: { include: { category: true } } },
    });

    return this.toLogOrderDto(created as LogWithRelations);
  }

  /** Categories + today's platform rates, for the "Log a Pickup" weigh screen. */
  async getRateCard(authUser: AuthUser): Promise<CollectorRateCardItemDto[]> {
    // The collector lookup only needs to lazily provision the row as a
    // side effect — its result isn't used here, so it doesn't need to
    // finish before we fetch categories. Run both round trips concurrently.
    const [, categories] = await Promise.all([
      this.getOrCreateCollector(authUser),
      this.prisma.category.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      rateLabel: c.rateLabel,
      baseRateInr: c.baseRateInr,
      iconKey: c.iconKey,
    }));
  }

  /** Maps a manual log into the same shape as a real order for frontend reuse. */
  private toLogOrderDto(log: LogWithRelations): CollectorOrderDto {
    return {
      id: log.id,
      status: OrderStatus.completed,
      scheduledAt: log.loggedAt.toISOString(),
      createdAt: log.createdAt.toISOString(),
      cancelledAt: null,
      etaMinutes: null,
      totalWeightKg: log.totalWeightKg ?? null,
      payoutInr: log.payoutInr ?? null,
      notes: log.notes,
      addressLine: log.addressText ?? "No address recorded",
      city: "",
      latitude: null,
      longitude: null,
      categories: log.categories.map((c) => ({
        categoryId: c.categoryId,
        name: c.category.name,
        rateLabel: c.category.rateLabel,
        baseRateInr: c.category.baseRateInr,
        weightKg: c.weightKg,
        rateInrPerKg: c.rateInrPerKg,
        payoutInr: c.payoutInr,
      })),
      photoUrls: [],
      // A manual log's contact is the collector's own — always visible, no
      // "hidden until accepted" logic (there's no marketplace claim to hide).
      customerName: log.customerName,
      customerPhone: log.customerPhone,
      timeline: [],
      isAvailable: false,
      source: "manual",
    };
  }
}
