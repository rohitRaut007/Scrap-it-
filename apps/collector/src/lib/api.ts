import { createApiClient } from "@scrap-it/api-client";
import { supabase } from "./supabase";
import type {
  CollectorEarnings,
  CollectorOrder,
  CollectorProfile,
  CollectorSummary,
  OrderListResponse,
  RateCardItem,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Parse the status code and message from the api-client's error string:
 * "HTTP 422: {"message":"...","statusCode":422}"
 */
function parseApiError(err: unknown): ApiError {
  if (err instanceof Error) {
    const match = /^HTTP (\d+): (.+)$/.exec(err.message);
    if (match) {
      const status = parseInt(match[1], 10);
      let message = match[2];
      try {
        const body = JSON.parse(message) as { message?: string | string[] };
        if (Array.isArray(body.message)) {
          message = body.message.join(", ");
        } else if (typeof body.message === "string") {
          message = body.message;
        }
      } catch {
        // keep raw message
      }
      return new ApiError(status, message);
    }
  }
  return new ApiError(0, String(err));
}

const _client = createApiClient({
  baseUrl: BASE_URL,
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await _client.request<T>(path, init);
  } catch (err) {
    throw parseApiError(err);
  }
}

const jsonInit = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body !== undefined
    ? {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    : {}),
});

/** Typed client for the collector portal endpoints. */
export const collectorApi = {
  request,
  profile: () => request<CollectorProfile>("/collectors/me"),
  updateProfile: (data: {
    name?: string;
    phone?: string;
    vehicleInfo?: string;
    serviceArea?: string;
    shopName?: string;
    shopAddressText?: string;
    gstNumber?: string;
    showBusinessDetailsOnReceipt?: boolean;
  }) => request<CollectorProfile>("/collectors/me", jsonInit("PATCH", data)),
  summary: () => request<CollectorSummary>("/collectors/me/summary"),
  availableOrders: (page = 1, pageSize = 20) =>
    request<OrderListResponse>(
      `/collectors/me/available-orders?page=${page}&pageSize=${pageSize}`,
    ),
  myOrders: (scope: "active" | "history" | "all", page = 1, pageSize = 20) =>
    request<OrderListResponse>(
      `/collectors/me/orders?scope=${scope}&page=${page}&pageSize=${pageSize}`,
    ),
  order: (id: string) => request<CollectorOrder>(`/collectors/me/orders/${id}`),
  accept: (id: string) =>
    request<CollectorOrder>(`/collectors/me/orders/${id}/accept`, jsonInit("POST")),
  decline: (id: string) =>
    request<{ ok: true }>(`/collectors/me/orders/${id}/decline`, jsonInit("POST")),
  updateStatus: (id: string, status: "en_route" | "arriving") =>
    request<CollectorOrder>(
      `/collectors/me/orders/${id}/status`,
      jsonInit("PATCH", { status }),
    ),
  complete: (
    id: string,
    items: { categoryId: string; weightKg: number; rateInrPerKg?: number }[],
  ) =>
    request<CollectorOrder>(
      `/collectors/me/orders/${id}/complete`,
      jsonInit("POST", { items }),
    ),
  earnings: (days = 30) =>
    request<CollectorEarnings>(`/collectors/me/earnings?days=${days}`),
  rateCard: () => request<RateCardItem[]>("/collectors/me/rate-card"),
  updateRateCard: (items: { categoryId: string; rateInrPerKg: number }[]) =>
    request<RateCardItem[]>(
      "/collectors/me/rate-card",
      jsonInit("PUT", { items }),
    ),
  logPickup: (data: {
    customerName: string;
    customerPhone?: string;
    addressText?: string;
    notes?: string;
    items: { categoryId: string; weightKg: number; rateInrPerKg?: number }[];
  }) =>
    request<CollectorOrder>("/collectors/me/pickup-logs", jsonInit("POST", data)),
  orderReceiptNumber: (id: string) =>
    request<{ receiptNumber: number }>(
      `/collectors/me/orders/${id}/receipt-number`,
      jsonInit("POST"),
    ),
  logReceiptNumber: (id: string) =>
    request<{ receiptNumber: number }>(
      `/collectors/me/pickup-logs/${id}/receipt-number`,
      jsonInit("POST"),
    ),
};
