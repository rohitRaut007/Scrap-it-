export type ClientType =
  | "SOCIETY"
  | "CORPORATE"
  | "RESTAURANT"
  | "FACTORY"
  | "OFFICE"
  | "PROCESSOR";

export type BillType = "RESIDENTIAL" | "COMMERCIAL";

export const CLIENT_TYPES: readonly ClientType[] = [
  "SOCIETY",
  "CORPORATE",
  "RESTAURANT",
  "FACTORY",
  "OFFICE",
  "PROCESSOR",
] as const;

/** The 5 client types that fall under the Commercial bill type — everything except SOCIETY. */
export const COMMERCIAL_CLIENT_TYPES: readonly ClientType[] = CLIENT_TYPES.filter(
  (t) => t !== "SOCIETY",
);

const BILL_TYPE_PREFIX: Record<BillType, string> = {
  RESIDENTIAL: "RES",
  COMMERCIAL: "COM",
};

/** The single lookup: Client.type -> which document/numbering series applies. */
export function resolveBillType(clientType: ClientType): BillType {
  return clientType === "SOCIETY" ? "RESIDENTIAL" : "COMMERCIAL";
}

/** e.g. formatBillNumber("COMMERCIAL", 16) -> "COM-016"; null while still a draft. */
export function formatBillNumber(
  billType: BillType,
  invoiceNumber: number | null,
): string | null {
  if (invoiceNumber == null) return null;
  return `${BILL_TYPE_PREFIX[billType]}-${String(invoiceNumber).padStart(3, "0")}`;
}

/** Canned line-item description per bill type, so collectors never type it by hand. */
export const DEFAULT_ITEM_DESCRIPTION: Record<BillType, string> = {
  RESIDENTIAL: "Garbage Collection and Other Operations",
  COMMERCIAL: "Commercial Waste Collection, Segregation & Disposal Services",
};

/** Default unit for the single pre-filled line item per bill type. */
export const DEFAULT_ITEM_UNIT: Record<BillType, string> = {
  RESIDENTIAL: "Units",
  COMMERCIAL: "Month",
};

/** Suggested premises-type line under the client's entity name, editable but pre-filled. */
export const DEFAULT_PREMISES_TYPE: Record<ClientType, string> = {
  SOCIETY: "Residential Society",
  CORPORATE: "Commercial Premises",
  RESTAURANT: "Restaurant Premises",
  FACTORY: "Factory Premises",
  OFFICE: "Office Premises",
  PROCESSOR: "Processing Facility",
};
