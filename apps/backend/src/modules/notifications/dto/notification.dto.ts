export class NotificationDto {
  id!: string;
  title!: string | null;
  body!: string | null;
  payload!: unknown;
  readAt!: string | null;
  createdAt!: string;
}

export class NotificationListResponse {
  data!: NotificationDto[];
  page!: number;
  pageSize!: number;
  total!: number;
  unreadCount!: number;
}
