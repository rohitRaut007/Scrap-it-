import { api } from "@/lib/api";
import type { AppNotification } from "@/types/domain";

type NotificationListResponse = {
  data: AppNotification[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
};

export const notificationService = {
  async list(): Promise<NotificationListResponse> {
    return api.get<NotificationListResponse>("/notifications");
  },

  async markRead(id: string): Promise<{ ok: true }> {
    return api.patch<{ ok: true }>(`/notifications/${id}/read`);
  },
};
