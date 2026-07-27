import useSWR from "swr";
import { adminApi } from "@/lib/api";

export type CollectorStatus = "active" | "suspended";

export interface CollectorAdminDto {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  vehicleInfo: string | null;
  rating: number | null;
  status: CollectorStatus;
  createdAt: string;
}

interface CollectorListResponse {
  data: CollectorAdminDto[];
  page: number;
  pageSize: number;
  total: number;
}

// pageSize=100 covers MVP scale; TODO: paginate when collector count > 100
export function useCollectors(enabled = true) {
  return useSWR<CollectorListResponse>(
    enabled ? "/admin/collectors?pageSize=100" : null,
    (url: string) => adminApi.request<CollectorListResponse>(url),
  );
}

export function updateCollectorStatus(id: string, status: CollectorStatus) {
  return adminApi.request<{ ok: true }>(`/admin/collectors/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
