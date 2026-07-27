import type { InvoiceStatus } from "./types";

export function invoiceStatusMessageKey(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    DRAFT: "draft",
    SENT: "sent",
    PAID: "paid",
    OVERDUE: "overdue",
  };
  return map[status];
}

export function invoiceStatusClasses(status: InvoiceStatus): string {
  if (status === "PAID") return "bg-cash/15 text-cash";
  if (status === "OVERDUE") return "bg-destructive/15 text-destructive";
  if (status === "SENT") return "bg-primary/15 text-primary";
  return "bg-muted text-muted-foreground"; // DRAFT
}

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

/** 1-12 -> translation key under the invoice.month namespace. */
export function monthMessageKey(month: number): string {
  return MONTH_KEYS[Math.max(0, Math.min(11, month - 1))];
}

/** Rolls a (month, year) pair forward by one month — 1-12 wraps into the next year. */
export function nextBillingPeriod(
  month: number,
  year: number,
): { month: number; year: number } {
  return month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
}

/** Today's (month, year) as 1-12 / full year, for defaulting a new invoice's period. */
export function currentBillingPeriod(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}
