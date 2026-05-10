/** Response contract for GET /auth/me (Nest). */
export interface AddressSummaryDto {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
}

export interface MeResponse {
  user?: {
    id: string;
    email?: string;
    name: string | null;
    phone: string | null;
    role: string;
    defaultAddress: AddressSummaryDto | null;
  };
}
