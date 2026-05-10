import type { AddressSummary } from "@/types/domain";

export function formatAddressSummary(a: AddressSummary): string {
  const parts = [a.line1, a.line2, a.city, a.region, a.postalCode].filter(
    (p): p is string => Boolean(p && String(p).trim()),
  );
  return parts.join(", ");
}
