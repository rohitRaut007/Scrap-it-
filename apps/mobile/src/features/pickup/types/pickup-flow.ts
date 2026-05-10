export type PickupFlowStepId =
  | "categories"
  | "photos"
  | "schedule"
  | "location"
  | "review";

export interface PickupAddressOption {
  id: string;
  label: string;
  line: string;
  isDefault?: boolean;
}

export type PickupPhotoStatus = "uploading" | "uploaded" | "error";

export interface PickupPhoto {
  /** Local URI from expo-image-picker for preview */
  uri: string;
  /** Server-issued key once upload completes; null while in flight or on error */
  storageKey: string | null;
  status: PickupPhotoStatus;
  /** Error message when status === "error" */
  error?: string;
}

export interface PickupFlowDraft {
  categoryIds: string[];
  photos: PickupPhoto[];
  /** Local calendar date key YYYY-MM-DD */
  scheduleDateKey: string | null;
  selectedTimeSlotId: string | null;
  /** ISO string sent to scheduling API */
  scheduledAtIso: string | null;
  addressId: string | null;
  addressLabel: string;
  addressLine: string;
}

export function createEmptyPickupDraft(): PickupFlowDraft {
  return {
    categoryIds: [],
    photos: [],
    scheduleDateKey: null,
    selectedTimeSlotId: null,
    scheduledAtIso: null,
    addressId: null,
    addressLabel: "",
    addressLine: "",
  };
}
