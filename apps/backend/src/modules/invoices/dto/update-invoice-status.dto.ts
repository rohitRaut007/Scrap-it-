import { IsIn } from "class-validator";

export const MANUAL_INVOICE_STATUSES = ["PAID", "OVERDUE"] as const;
export type ManualInvoiceStatus = (typeof MANUAL_INVOICE_STATUSES)[number];

/** DRAFT->SENT only happens via POST /invoices/:id/generate — this endpoint
 *  is for the manual, no-automation transitions after that. */
export class UpdateInvoiceStatusDto {
  @IsIn(MANUAL_INVOICE_STATUSES)
  status!: ManualInvoiceStatus;
}
