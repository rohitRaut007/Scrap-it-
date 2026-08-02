// Mirrors apps/backend/src/modules/collectors/dto/collector-portal.dto.ts

import type { OrderStatus } from "./order-utils";

export interface CollectorOrderCategory {
  categoryId: string;
  name: string;
  rateLabel: string;
  weightKg: number | null;
  rateInrPerKg: number | null;
  payoutInr: number | null;
}

export interface CollectorOrder {
  id: string;
  status: OrderStatus;
  scheduledAt: string;
  createdAt: string;
  cancelledAt: string | null;
  etaMinutes: number | null;
  totalWeightKg: number | null;
  payoutInr: number | null;
  notes: string | null;
  addressLine: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  categories: CollectorOrderCategory[];
  photoUrls: string[];
  customerName: string | null;
  customerPhone: string | null;
  timeline: { eventType: string; occurredAt: string }[];
  isAvailable: boolean;
  /** "manual" = logged by the collector for their own customer, not sourced from the app. */
  source: "app" | "manual";
  /** Sequential per-collector receipt number; null until a receipt has been printed once. */
  receiptNumber: number | null;
  /** "direct" = the customer booked through this collector's own QR/booking link. */
  bookingSource: "direct" | null;
}

export interface OrderListResponse {
  data: CollectorOrder[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CollectorProfile {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  vehicleInfo: string | null;
  serviceArea: string | null;
  rating: number | null;
  bookingSlug: string | null;
  bookingUrl: string | null;
  totalCompleted: number;
  totalEarningsInr: number;
  memberSince: string;
  shopName: string | null;
  shopAddressText: string | null;
  gstNumber: string | null;
  showBusinessDetailsOnReceipt: boolean;
  /** True when at least one of shopName/shopAddressText/gstNumber is set. */
  hasBusinessDetails: boolean;
  businessTagline: string | null;
  payableTo: string | null;
  /** Hex accent color for the invoice letterhead; null = design-system default. */
  accentColor: string | null;
  /** Default Terms & Conditions text for new commercial invoices; null = fallback text. */
  defaultTermsAndConditions: string | null;
}

export interface CollectorSummary {
  todayEarningsInr: number;
  todayCompleted: number;
  weekEarningsInr: number;
  monthEarningsInr: number;
  activeOrders: number;
  availableOrders: number;
  nextOrder: CollectorOrder | null;
  rating: number | null;
  totalCompleted: number;
}

export interface EarningsDay {
  date: string;
  amountInr: number;
  pickups: number;
  weightKg: number;
}

export interface CollectorEarnings {
  todayInr: number;
  weekInr: number;
  monthInr: number;
  totalInr: number;
  totalPickups: number;
  totalWeightKg: number;
  days: EarningsDay[];
  recentOrders: CollectorOrder[];
}

/** Category + the collector's own saved rate, for the pickup weigh-in screens. */
export interface RateCardItem {
  id: string;
  name: string;
  rateLabel: string;
  /** Null when the collector hasn't set a rate for this category yet. */
  rateInrPerKg: number | null;
  iconKey: string;
  /** When this rate was last set/changed; null alongside a null rate. */
  rateUpdatedAt: string | null;
}

/** What a scanned booking QR/link is allowed to see — the public `/book/:slug` page. */
export interface PublicCollectorProfile {
  name: string | null;
  rating: number | null;
  serviceArea: string | null;
  bookingSlug: string;
  rateCard: RateCardItem[];
}

/** Payload for a no-account booking submitted from the public `/book/:slug` page. */
export interface GuestBookingPayload {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  latitude?: number;
  longitude?: number;
  categoryIds: string[];
  scheduledAt: string;
  notes?: string;
}

export interface GuestBookingResult {
  orderId: string;
  scheduledAt: string;
  /** False if the collector had gone inactive and the booking fell back to the open pool. */
  assignedDirect: boolean;
  collectorName: string | null;
}

// --- Invoices ---
// Mirrors apps/backend/src/modules/invoices/dto/*.ts

import type { ClientType, BillType } from "@scrap-it/constants";
export type { ClientType, BillType } from "@scrap-it/constants";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE";

export interface Client {
  id: string;
  type: ClientType;
  siteName: string;
  entityName: string | null;
  premisesType: string | null;
  gstin: string | null;
  contactName: string | null;
  phone: string | null;
  addressText: string | null;
  billToAddressText: string | null;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  billType: BillType;
  /** Formatted "RES-007" / "COM-016"; null while still a draft. */
  billNumber: string | null;
  invoiceNumber: number | null;
  billingMonth: number;
  billingYear: number;
  issuedAt: string | null;
  status: InvoiceStatus;
  payableTo: string | null;
  referencePoNumber: string | null;
  termsOfPayment: string | null;
  termsAndConditions: string | null;
  subtotal: number;
  total: number;
  amountInWords: string | null;
  createdAt: string;
  client: Client;
  items: InvoiceItem[];
}

export interface InvoiceListResponse {
  data: Invoice[];
  page: number;
  pageSize: number;
  total: number;
}
