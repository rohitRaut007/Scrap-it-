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
}
