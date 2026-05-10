import { formatAddressSummary } from "@/lib/formatAddress";
import type { AddressSummary } from "@/types/domain";
import type { PickupAddressOption } from "../types/pickup-flow";

/**
 * Convert backend-issued AddressSummary rows into the wizard's option shape.
 * Empty input means the user has no saved addresses yet — caller should prompt
 * an "Add address" flow before submission.
 */
export function buildPickupAddressOptions(
  addresses: AddressSummary[],
): PickupAddressOption[] {
  return addresses.map((address) => ({
    id: address.id,
    label: address.label?.trim() || "Address",
    line: formatAddressSummary(address),
    isDefault: address.isDefault === true,
  }));
}
