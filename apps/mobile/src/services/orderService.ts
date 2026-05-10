import { ApiError, api } from "@/lib/api";
import type { PickupOrder } from "@/types/domain";

type OrderResponse = { data: PickupOrder };
type ActiveOrderResponse = { data: PickupOrder | null };
type OrderListResponse = {
  data: PickupOrder[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateOrderInput = {
  categoryIds: string[];
  scheduledAt: string;
  addressId: string;
  notes?: string;
  photoStorageKeys?: string[];
};

export const orderService = {
  async list(): Promise<PickupOrder[]> {
    const res = await api.get<OrderListResponse>("/orders");
    return res.data;
  },

  async getById(id: string): Promise<PickupOrder | null> {
    try {
      const res = await api.get<OrderResponse>(`/orders/${id}`);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async getActive(): Promise<PickupOrder | null> {
    const res = await api.get<ActiveOrderResponse>("/orders/active");
    return res.data;
  },

  async create(input: CreateOrderInput): Promise<PickupOrder> {
    const res = await api.post<OrderResponse>("/orders", input);
    return res.data;
  },

  async cancel(id: string, reason?: string): Promise<PickupOrder> {
    const res = await api.post<OrderResponse>(`/orders/${id}/cancel`, {
      reason,
    });
    return res.data;
  },
};
