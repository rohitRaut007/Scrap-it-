import { createApiClient } from "@scrap-it/api-client";
import type { ClientType } from "@scrap-it/constants";
import { supabase } from "./supabase";
import type {
  Client,
  CollectorEarnings,
  CollectorOrder,
  CollectorProfile,
  CollectorSummary,
  Invoice,
  InvoiceListResponse,
  InvoiceStatus,
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

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Parse the status code and message from the api-client's error string:
 * "HTTP 422: {"message":"...","statusCode":422}"
 *
 * Only a well-formed `{message}` body (our own backend's deliberate,
 * user-facing error strings) is ever shown verbatim — anything else
 * (a malformed body, a JSON parse failure, a network-level TypeError)
 * falls back to a generic message instead of leaking raw technical text.
 */
function parseApiError(err: unknown): ApiError {
  if (err instanceof Error) {
    const match = /^HTTP (\d+): (.+)$/.exec(err.message);
    if (match) {
      const status = parseInt(match[1], 10);
      try {
        const body = JSON.parse(match[2]) as { message?: string | string[] };
        if (Array.isArray(body.message)) {
          return new ApiError(status, body.message.join(", "));
        }
        if (typeof body.message === "string") {
          return new ApiError(status, body.message);
        }
      } catch {
        // fall through — don't leak the raw response body
      }
      return new ApiError(status, GENERIC_ERROR_MESSAGE);
    }
  }
  return new ApiError(0, GENERIC_ERROR_MESSAGE);
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
    const apiError = parseApiError(err);
    if (apiError.status === 401) {
      // Session is expired/invalid — force a clean re-auth rather than
      // leaving the app in a half-authenticated state. Runs outside React's
      // render tree, so a hard navigation is the right tool here.
      void supabase.auth.signOut().finally(() => {
        window.location.href = "/login?reason=expired";
      });
    }
    throw apiError;
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
    businessTagline?: string;
    payableTo?: string;
    accentColor?: string;
    defaultTermsAndConditions?: string;
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
  clients: () => request<Client[]>("/invoices/clients"),
  createClient: (data: {
    type: ClientType;
    siteName: string;
    entityName?: string;
    premisesType?: string;
    gstin?: string;
    contactName?: string;
    phone?: string;
    addressText?: string;
    billToAddressText?: string;
  }) => request<Client>("/invoices/clients", jsonInit("POST", data)),
  invoices: (page = 1, pageSize = 20) =>
    request<InvoiceListResponse>(`/invoices?page=${page}&pageSize=${pageSize}`),
  invoice: (id: string) => request<Invoice>(`/invoices/${id}`),
  createInvoice: (data: {
    clientId: string;
    billingMonth: number;
    billingYear: number;
    payableTo?: string;
    referencePoNumber?: string;
    termsOfPayment?: string;
    termsAndConditions?: string;
    items: { description?: string; quantity: number; unit?: string; rate: number }[];
  }) => request<Invoice>("/invoices", jsonInit("POST", data)),
  updateInvoice: (
    id: string,
    data: {
      billingMonth?: number;
      billingYear?: number;
      payableTo?: string;
      referencePoNumber?: string;
      termsOfPayment?: string;
      termsAndConditions?: string;
      items?: { description?: string; quantity: number; unit?: string; rate: number }[];
    },
  ) => request<Invoice>(`/invoices/${id}`, jsonInit("PATCH", data)),
  generateInvoice: (id: string) =>
    request<Invoice>(`/invoices/${id}/generate`, jsonInit("POST")),
  updateInvoiceStatus: (id: string, status: Extract<InvoiceStatus, "PAID" | "OVERDUE">) =>
    request<Invoice>(`/invoices/${id}/status`, jsonInit("PATCH", { status })),
};
