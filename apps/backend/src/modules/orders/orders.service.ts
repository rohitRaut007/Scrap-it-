import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Address,
  OrderStatus,
  PickupOrder,
  PickupOrderPhoto,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { ListOrdersQueryDto } from "./dto/list-orders-query.dto";
import { OrderDto } from "./dto/order.dto";

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
};

const ORDER_INCLUDE = {
  address: true,
  categories: { select: { categoryId: true } },
  photos: true,
} satisfies Prisma.PickupOrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
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

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException("Invalid scheduledAt");
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException("scheduledAt must be in the future");
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) {
      throw new BadRequestException("Address not found");
    }

    const categoryIds = Array.from(new Set(dto.categoryIds));
    const categoryRows = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, active: true },
      select: { id: true },
    });
    if (categoryRows.length !== categoryIds.length) {
      throw new BadRequestException("Unknown or inactive category in categoryIds");
    }

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

    const created = await this.prisma.$transaction(async (tx) => {
      const order = await tx.pickupOrder.create({
        data: {
          customerId: userId,
          status: OrderStatus.scheduled,
          scheduledAt,
          addressId: address.id,
          notes: dto.notes,
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
            create: {
              eventType: "created",
              metadata: { actorId: userId, actorRole: "customer" },
            },
          },
        },
        include: ORDER_INCLUDE,
      });
      return order;
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
    };
  }
}

function formatAddressLine(address: Address): string {
  return [address.line1, address.line2, address.city, address.region]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(", ");
}

function contentTypeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}
