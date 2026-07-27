import type { InvoiceStatus } from "@prisma/client";
import type { BillType, ClientType } from "@scrap-it/constants";

export interface ClientDto {
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

export interface InvoiceItemDto {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface InvoiceDto {
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
  client: ClientDto;
  items: InvoiceItemDto[];
}

export interface InvoiceListResponse {
  data: InvoiceDto[];
  page: number;
  pageSize: number;
  total: number;
}
