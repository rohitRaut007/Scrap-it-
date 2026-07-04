import useSWR, { type KeyedMutator } from "swr";
import { adminApi } from "@/lib/api";

interface OrdersParams {
  page: number;
  pageSize: number;
  status?: string;
}

export interface AdminOrderDto {
  id: string;
  status: string;
  categoryIds: string[];
  categoryNames: string[];
  scheduledAt: string;
  etaMinutes: number | null;
  addressId: string;
  addressLine: string;
  totalWeightKg: number | null;
  photoUrls: string[];
  notes: string | null;
  createdAt: string;
  cancelledAt: string | null;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string;
  collectorInfo: CollectorInfo | null;
  timeline: TimelineEntry[];
}

export interface CollectorInfo {
  id: string;
  userId: string;
  name: string | null;
  phone: string | null;
  vehicleInfo: string | null;
  rating: number | null;
}

export interface TimelineEntry {
  eventType: string;
  occurredAt: string;
  metadata: unknown;
}

interface OrderListResponse {
  data: AdminOrderDto[];
  page: number;
  pageSize: number;
  total: number;
}

function compareOrderList(
  a: OrderListResponse | undefined,
  b: OrderListResponse | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useOrders(params: OrdersParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.status) query.set("status", params.status);

  return useSWR<OrderListResponse>(
    `/admin/orders?${query}`,
    (url: string) => adminApi.request(url),
    {
      keepPreviousData: true,
      refreshInterval: 12_000,
      refreshWhenHidden: false,
      compare: compareOrderList,
    },
  );
}

export function useOrder(id: string | null): {
  data: AdminOrderDto | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<AdminOrderDto>;
} {
  return useSWR<AdminOrderDto>(
    id ? `/admin/orders/${id}` : null,
    (url: string) => adminApi.request<AdminOrderDto>(url),
  );
}
