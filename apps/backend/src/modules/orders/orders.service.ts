import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  Address,
  OrderStatus,
  PickupOrder,
  PickupOrderPhoto,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CollectorPortalService } from "../collectors/collector-portal.service";
import { UploadsService } from "../uploads/uploads.service";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { GuestBookingDto } from "./dto/guest-booking.dto";
import { ListOrdersQueryDto } from "./dto/list-orders-query.dto";
import { GuestBookingResultDto, OrderDto } from "./dto/order.dto";
import { RateOrderDto } from "./dto/rate-order.dto";

/** A guest who has booked more than this many times in 24h is almost certainly spam/abuse. */
const GUEST_BOOKINGS_PER_DAY_LIMIT = 3;

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.scheduled,
  OrderStatus.assigned,
  OrderStatus.en_route,
  OrderStatus.arriving,
];

const CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.scheduled,
  OrderStatus.assigned,
];

type OrderWithRelations = PickupOrder & {
  address: Address;
  categories: { categoryId: string }[];
  photos: PickupOrderPhoto[];
  rating: { id: string } | null;
};

const ORDER_INCLUDE = {
  address: true,
  categories: { select: { categoryId: true } },
  photos: true,
  rating: { select: { id: true } },
} satisfies Prisma.PickupOrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly collectorPortal: CollectorPortalService,
  ) {}

  async list(userId: string, query: ListOrdersQueryDto) {
    const where: Prisma.PickupOrderWhereInput = { customerId: userId };
    if (query.status) {
      where.status = query.status;
    } else if (query.activeOnly) {
      where.status = { in: ACTIVE_STATUSES };
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pickupOrder.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.pickupOrder.count({ where }),
    ]);

    const data = await Promise.all(rows.map((row) => this.toDto(row)));
    return { data, page, pageSize, total };
  }

  async getActive(userId: string): Promise<OrderDto | null> {
    const row = await this.prisma.pickupOrder.findFirst({
      where: { customerId: userId, status: { in: ACTIVE_STATUSES } },
      include: ORDER_INCLUDE,
      orderBy: { scheduledAt: "asc" },
    });
    if (!row) return null;
    return this.toDto(row);
  }

  async getById(userId: string, orderId: string): Promise<OrderDto> {
    const row = await this.prisma.pickupOrder.findFirst({
      where: { id: orderId, customerId: userId },
      include: ORDER_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException("Order not found");
    }
    return this.toDto(row);
  }

  async create(
    userId: string,
    dto: CreateOrderDto,
    idempotencyKey?: string,
  ): Promise<OrderDto> {
    if (idempotencyKey) {
      const existing = await this.prisma.idempotencyRecord.findUnique({
        where: { userId_key: { userId, key: idempotencyKey } },
      });
      if (existing) {
        return existing.responseJson as unknown as OrderDto;
      }
    }

    const scheduledAt = this.parseFutureScheduledAt(dto.scheduledAt);

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) {
      throw new BadRequestException("Address not found");
    }

    const categoryIds = await this.validateCategoryIds(dto.categoryIds);

    const photoKeys = Array.from(new Set(dto.photoStorageKeys ?? []));
    if (photoKeys.length > 0) {
      const verifications = await Promise.all(
        photoKeys.map((key) => this.uploads.verifyOrderPhotoKey(userId, key)),
      );
      if (verifications.some((ok) => !ok)) {
        throw new BadRequestException(
          "One or more photoStorageKeys are invalid or not owned by the caller",
        );
      }
    }

    // A stale/mistyped slug must never block a booking — fall back to the
    // normal open-pool flow (collectorId stays null) instead of erroring.
    const directCollector = dto.collectorSlug
      ? await this.collectorPortal.resolveActiveCollectorBySlug(
          dto.collectorSlug,
        )
      : null;

    const created = await this.persistOrder({
      customerId: userId,
      addressId: address.id,
      scheduledAt,
      notes: dto.notes,
      categoryIds,
      photoKeys,
      directCollectorId: directCollector?.id ?? null,
      actorRole: "customer",
    });

    const dtoOut = await this.toDto(created);

    if (idempotencyKey) {
      await this.prisma.idempotencyRecord.create({
        data: {
          userId,
          key: idempotencyKey,
          responseJson: dtoOut as unknown as Prisma.InputJsonValue,
        },
      });
    }

    return dtoOut;
  }

  /**
   * A booking made from a collector's public `/book/:slug` page by someone
   * with no account. Resolves (or creates) a lightweight "guest" identity
   * from their phone number instead of a JWT — see `normalizeIndianPhone`.
   * Always resolves the collector directly (this only exists on their own
   * page); falls back to the open pool if they've gone inactive since the
   * page loaded, same as the authenticated flow above.
   */
  async createGuestBooking(
    slug: string,
    dto: GuestBookingDto,
  ): Promise<GuestBookingResultDto> {
    const scheduledAt = this.parseFutureScheduledAt(dto.scheduledAt);
    const categoryIds = await this.validateCategoryIds(dto.categoryIds);
    const phone = normalizeIndianPhone(dto.phone);
    if (!phone) {
      throw new BadRequestException(
        "Enter a valid 10-digit Indian mobile number",
      );
    }

    const guestEmail = `guest+${phone.slice(1)}@guest.scrapit.local`;
    const guestUser = await this.prisma.user.upsert({
      where: { email: guestEmail },
      update: { name: dto.name.trim(), phone },
      create: {
        id: randomUUID(),
        email: guestEmail,
        name: dto.name.trim(),
        phone,
        role: "customer",
      },
    });

    const recentCount = await this.prisma.pickupOrder.count({
      where: {
        customerId: guestUser.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recentCount >= GUEST_BOOKINGS_PER_DAY_LIMIT) {
      throw new UnprocessableEntityException(
        "You've already got a few pickups booked today — we'll be in touch soon. Contact support if you need another one urgently.",
      );
    }

    const address = await this.prisma.address.create({
      data: {
        userId: guestUser.id,
        line1: dto.addressLine.trim(),
        city: dto.city.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    const directCollector =
      await this.collectorPortal.resolveActiveCollectorBySlug(slug);

    const created = await this.persistOrder({
      customerId: guestUser.id,
      addressId: address.id,
      scheduledAt,
      notes: dto.notes,
      categoryIds,
      photoKeys: [],
      directCollectorId: directCollector?.id ?? null,
      actorRole: "customer",
    });

    return {
      orderId: created.id,
      scheduledAt: created.scheduledAt.toISOString(),
      assignedDirect: directCollector != null,
      collectorName: directCollector?.user.name ?? null,
    };
  }

  private parseFutureScheduledAt(raw: string): Date {
    const scheduledAt = new Date(raw);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException("Invalid scheduledAt");
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException("scheduledAt must be in the future");
    }
    return scheduledAt;
  }

  private async validateCategoryIds(rawIds: string[]): Promise<string[]> {
    const categoryIds = Array.from(new Set(rawIds));
    const categoryRows = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, active: true },
      select: { id: true },
    });
    if (categoryRows.length !== categoryIds.length) {
      throw new BadRequestException(
        "Unknown or inactive category in categoryIds",
      );
    }
    return categoryIds;
  }

  /** Shared PickupOrder-creation core for both the authenticated and guest booking paths. */
  private async persistOrder(params: {
    customerId: string;
    addressId: string;
    scheduledAt: Date;
    notes: string | undefined;
    categoryIds: string[];
    photoKeys: string[];
    directCollectorId: string | null;
    actorRole: "customer";
  }): Promise<OrderWithRelations> {
    const {
      customerId,
      addressId,
      scheduledAt,
      notes,
      categoryIds,
      photoKeys,
      directCollectorId,
      actorRole,
    } = params;

    return this.prisma.$transaction(async (tx) => {
      return tx.pickupOrder.create({
        data: {
          customerId,
          status: directCollectorId
            ? OrderStatus.assigned
            : OrderStatus.scheduled,
          scheduledAt,
          addressId,
          notes,
          collectorId: directCollectorId ?? undefined,
          bookingSource: directCollectorId ? "direct" : undefined,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
          photos:
            photoKeys.length > 0
              ? {
                  create: photoKeys.map((storageKey) => ({
                    storageKey,
                    contentType: contentTypeFromKey(storageKey),
                  })),
                }
              : undefined,
          timeline: {
            create: directCollectorId
              ? [
                  {
                    eventType: "created",
                    metadata: { actorId: customerId, actorRole },
                  },
                  {
                    eventType: "assigned",
                    metadata: {
                      actorId: customerId,
                      actorRole,
                      collectorId: directCollectorId,
                      bookingSource: "direct",
                    },
                  },
                ]
              : {
                  eventType: "created",
                  metadata: { actorId: customerId, actorRole },
                },
          },
        },
        include: ORDER_INCLUDE,
      });
    });
  }

  async cancel(
    userId: string,
    orderId: string,
    dto: CancelOrderDto,
  ): Promise<OrderDto> {
    const existing = await this.prisma.pickupOrder.findFirst({
      where: { id: orderId, customerId: userId },
      include: ORDER_INCLUDE,
    });
    if (!existing) {
      throw new NotFoundException("Order not found");
    }

    if (existing.status === OrderStatus.cancelled) {
      // Idempotent: re-cancel returns the same row.
      return this.toDto(existing);
    }

    if (!CANCELLABLE_STATUSES.includes(existing.status)) {
      if (
        existing.status === OrderStatus.en_route ||
        existing.status === OrderStatus.arriving
      ) {
        throw new ConflictException(
          "Driver is en route. Contact support to cancel.",
        );
      }
      throw new ConflictException(
        `Order in status ${existing.status} cannot be cancelled`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.pickupOrder.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.cancelled,
          cancelledAt: new Date(),
        },
        include: ORDER_INCLUDE,
      });
      await tx.pickupTimeline.create({
        data: {
          orderId,
          eventType: "cancelled",
          metadata: {
            actorId: userId,
            actorRole: "customer",
            reason: dto.reason ?? null,
          },
        },
      });
      return row;
    });

    return this.toDto(updated);
  }

  async rate(
    userId: string,
    orderId: string,
    dto: RateOrderDto,
  ): Promise<{ ok: true }> {
    const order = await this.prisma.pickupOrder.findFirst({
      where: { id: orderId, customerId: userId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== OrderStatus.completed) {
      throw new UnprocessableEntityException(
        "Only completed orders can be rated",
      );
    }
    if (!order.collectorId) {
      throw new UnprocessableEntityException("Order has no collector to rate");
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.rating.create({
          data: {
            orderId,
            customerId: userId,
            collectorId: order.collectorId!,
            score: dto.score,
            comment: dto.comment,
          },
        });
        const agg = await tx.rating.aggregate({
          where: { collectorId: order.collectorId! },
          _avg: { score: true },
        });
        await tx.collector.update({
          where: { id: order.collectorId! },
          data: { rating: agg._avg.score },
        });
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictException("Order already rated");
      }
      throw err;
    }

    return { ok: true };
  }

  private async toDto(row: OrderWithRelations): Promise<OrderDto> {
    const photoUrls = (
      await Promise.all(
        row.photos.map((photo) =>
          this.uploads.getOrderPhotoReadUrl(photo.storageKey),
        ),
      )
    ).filter((url): url is string => typeof url === "string");

    return {
      id: row.id,
      status: row.status,
      categoryIds: row.categories.map((c) => c.categoryId),
      scheduledAt: row.scheduledAt.toISOString(),
      etaMinutes: row.etaMinutes ?? null,
      driver: null,
      addressId: row.addressId,
      addressLine: formatAddressLine(row.address),
      items: [],
      totalWeightKg: row.totalWeightKg ?? null,
      photoUrls,
      createdAt: row.createdAt.toISOString(),
      cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
      hasRating: row.rating !== null,
    };
  }
}

function formatAddressLine(address: Address): string {
  return [address.line1, address.line2, address.city, address.region]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(", ");
}

/**
 * Canonicalizes an Indian mobile number to `+91XXXXXXXXXX` so the same
 * person entering "9876543210", "+91 98765 43210", or "091-98765-43210"
 * always resolves to the same guest identity. Returns null (never throws)
 * for anything that doesn't reduce to a plausible 10-digit mobile number —
 * callers turn that into a normal validation error.
 */
function normalizeIndianPhone(raw: string): string | null {
  let digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (!/^\d{10}$/.test(digits)) return null;
  return `+91${digits}`;
}

function contentTypeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}
