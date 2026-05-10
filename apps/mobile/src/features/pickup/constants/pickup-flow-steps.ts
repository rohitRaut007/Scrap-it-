import type { PickupFlowStepId } from "../types/pickup-flow";

/** Ordered wizard steps; configuration-driven for future reorder or feature flags. */
export const PICKUP_FLOW_STEP_IDS = [
  "categories",
  "photos",
  "schedule",
  "location",
  "review",
] as const satisfies readonly PickupFlowStepId[];

export const PICKUP_FLOW_STEP_COUNT = PICKUP_FLOW_STEP_IDS.length;

export function pickupStepIndex(id: PickupFlowStepId): number {
  return PICKUP_FLOW_STEP_IDS.indexOf(id);
}
