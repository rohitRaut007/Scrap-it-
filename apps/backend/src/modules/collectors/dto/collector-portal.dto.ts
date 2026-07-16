import type { OrderStatus } from "@prisma/client";

/** Category line on an order, with rate + logged weight (after completion). */
export interface CollectorOrderCategoryDto {
  categoryId: string;
  name: string;
  rateLabel: string;
  weightKg: number | null;
  rateInrPerKg: number | null;
  payoutInr: number | null;
}

export interface CollectorOrderDto {
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
  categories: CollectorOrderCategoryDto[];
  photoUrls: string[];
  customerName: string | null;
  /** Hidden (null) until the order is accepted by this collector. */
  customerPhone: string | null;
  timeline: { eventType: string; occurredAt: string }[];
  /** True when the order is claimable from the available feed. */
  isAvailable: boolean;
  /** "manual" = logged by the collector for their own customer, not sourced from the app. */
  source: "app" | "manual";
  /** Sequential per-collector receipt number; null until a receipt has been printed once. */
  receiptNumber: number | null;
}

export interface CollectorOrderListResponse {
  data: CollectorOrderDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CollectorProfileDto {
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
  /** True when at least one of shopName/shopAddressText/gstNumber is set — drives
   *  whether the receipt visibility toggle appears anywhere in the UI at all. */
  hasBusinessDetails: boolean;
}

export interface CollectorSummaryDto {
  todayEarningsInr: number;
  todayCompleted: number;
  weekEarningsInr: number;
  monthEarningsInr: number;
  activeOrders: number;
  availableOrders: number;
  nextOrder: CollectorOrderDto | null;
  rating: number | null;
  totalCompleted: number;
}

export interface EarningsDayDto {
  /** ISO date (yyyy-mm-dd), local server time. */
  date: string;
  amountInr: number;
  pickups: number;
  weightKg: number;
}

export interface CollectorEarningsDto {
  todayInr: number;
  weekInr: number;
  monthInr: number;
  totalInr: number;
  totalPickups: number;
  totalWeightKg: number;
  days: EarningsDayDto[];
  recentOrders: CollectorOrderDto[];
}

/** Category + the collector's own saved rate, for the pickup weigh-in screens. */
export interface CollectorRateCardItemDto {
  id: string;
  name: string;
  rateLabel: string;
  /** Null when the collector hasn't set a rate for this category yet. */
  rateInrPerKg: number | null;
  iconKey: string;
}
