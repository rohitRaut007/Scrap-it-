export type OrderStatus =
  | "scheduled"
  | "assigned"
  | "en_route"
  | "arriving"
  | "completed"
  | "cancelled";

export interface Category {
  id: string;
  name: string;
  rateLabel: string;
  iconKey: string;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
}

export interface PickupOrder {
  id: string;
  status: OrderStatus;
  categoryIds: string[];
  scheduledAt: string;
  etaMinutes?: number | null;
  driver?: Driver | null;
  addressId: string;
  addressLine: string;
  items?: { label: string; quantity: number }[];
  totalWeightKg?: number | null;
  photoUrls?: string[];
  createdAt?: string;
  cancelledAt?: string | null;
}

export interface AddressSummary {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role?: string;
  defaultAddress?: AddressSummary | null;
}

export interface AnalyticsSummary {
  pickupsCompleted: number;
  weightKgApprox: number;
  estimatedPayoutInr: number;
}
