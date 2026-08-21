import useSWR from "swr";
import { adminApi } from "@/lib/api";

export type CollectorStatus = "active" | "suspended" | "removed";

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

export interface CollectorInviteInput {
  name: string;
  phone: string;
  email: string;
  vehicleInfo?: string;
}

export interface CollectorInviteResponse {
  collector: CollectorAdminDto;
  tempPassword: string;
  isReactivation: boolean;
}

// pageSize=100 covers MVP scale; TODO: paginate when collector count > 100
export function useCollectors(enabled = true) {
  return useSWR<CollectorListResponse>(
    enabled ? "/admin/collectors?pageSize=100" : null,
    (url: string) => adminApi.request<CollectorListResponse>(url),
  );
}

export function inviteCollector(input: CollectorInviteInput) {
  return adminApi.request<CollectorInviteResponse>("/admin/collectors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateCollectorStatus(
  id: string,
  status: CollectorStatus,
  reason?: string,
) {
  return adminApi.request<{ ok: true }>(`/admin/collectors/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reason }),
  });
}
