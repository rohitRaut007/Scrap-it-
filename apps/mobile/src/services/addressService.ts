import { api } from "@/lib/api";
import type { AddressSummary } from "@/types/domain";

type AddressResponse = { data: AddressSummary };
type AddressListResponse = { data: AddressSummary[] };

export type CreateAddressInput = {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
};

export type UpdateAddressInput = Partial<CreateAddressInput>;

export const addressService = {
  async list(): Promise<AddressSummary[]> {
    const res = await api.get<AddressListResponse>("/me/addresses");
    return res.data;
  },

  async create(input: CreateAddressInput): Promise<AddressSummary> {
    const res = await api.post<AddressResponse>("/me/addresses", input);
    return res.data;
  },

  async update(id: string, input: UpdateAddressInput): Promise<AddressSummary> {
    const res = await api.patch<AddressResponse>(`/me/addresses/${id}`, input);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete<void>(`/me/addresses/${id}`);
  },

  async setDefault(id: string): Promise<AddressSummary> {
    const res = await api.post<AddressResponse>(
      `/me/addresses/${id}/default`,
    );
    return res.data;
  },
};
