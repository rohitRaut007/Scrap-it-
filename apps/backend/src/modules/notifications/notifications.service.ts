import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { NotificationDto, NotificationListResponse } from "./dto/notification.dto";

type CreateNotificationInput = {
  userId: string;
  title: string;
  body: string;
  payload?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<NotificationListResponse> {
    const [rows, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    const data: NotificationDto[] = rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      payload: n.payload,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    }));

    return { data, page, pageSize, total, unreadCount };
  }

  async markRead(userId: string, id: string): Promise<{ ok: true }> {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException("Notification not found");

    if (!existing.readAt) {
      await this.prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    }
    return { ok: true };
  }

  /** Accepts a transaction client so callers can write alongside their own updates atomically. */
  create(tx: Prisma.TransactionClient, input: CreateNotificationInput) {
    return tx.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        payload: input.payload,
      },
    });
  }
}
