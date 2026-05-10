import { useCallback, useMemo, useState } from "react";
import { buildLocalScheduledIso } from "@/features/pickup/lib/schedule-date-utils";
import { getPickupTimeSlot } from "@/features/pickup/constants/time-slots";
import {
  PICKUP_FLOW_STEP_IDS,
  PICKUP_FLOW_STEP_COUNT,
} from "@/features/pickup/constants/pickup-flow-steps";
import {
  createEmptyPickupDraft,
  type PickupFlowDraft,
  type PickupFlowStepId,
} from "@/features/pickup/types/pickup-flow";

export function mergePickupDraft(
  prev: PickupFlowDraft,
  patch: Partial<PickupFlowDraft>,
): PickupFlowDraft {
  const next: PickupFlowDraft = { ...prev, ...patch };
  if (!next.scheduleDateKey || !next.selectedTimeSlotId) {
    next.scheduledAtIso = null;
    return next;
  }
  const slot = getPickupTimeSlot(next.selectedTimeSlotId);
  if (!slot || slot.full) {
    next.scheduledAtIso = null;
    return next;
  }
  next.scheduledAtIso = buildLocalScheduledIso(
    next.scheduleDateKey,
    slot.startHour,
  );
  return next;
}

export function canProceedPickupStep(
  step: PickupFlowStepId,
  draft: PickupFlowDraft,
): boolean {
  switch (step) {
    case "categories":
      return draft.categoryIds.length > 0;
    case "photos":
      // Block "Continue" while any photo is mid-upload or in error state.
      return draft.photos.every((p) => p.status === "uploaded");
    case "schedule":
      return Boolean(
        draft.scheduleDateKey &&
          draft.selectedTimeSlotId &&
          draft.scheduledAtIso,
      );
    case "location":
      return Boolean(draft.addressId && draft.addressLine.trim());
    case "review":
      return true;
    default:
      return false;
  }
}

export function usePickupFlow(initialCategoryIds?: string[]) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<PickupFlowDraft>(() => {
    const base = createEmptyPickupDraft();
    if (initialCategoryIds?.length) {
      base.categoryIds = [...initialCategoryIds];
    }
    return base;
  });

  const stepId = PICKUP_FLOW_STEP_IDS[stepIndex] ?? "categories";

  const patchDraft = useCallback((patch: Partial<PickupFlowDraft>) => {
    setDraft((prev) => mergePickupDraft(prev, patch));
  }, []);

  const setCategoryIds = useCallback((categoryIds: string[]) => {
    setDraft((prev) => mergePickupDraft(prev, { categoryIds }));
  }, []);

  const toggleCategoryId = useCallback((id: string) => {
    setDraft((prev) => {
      const has = prev.categoryIds.includes(id);
      const categoryIds = has
        ? prev.categoryIds.filter((x) => x !== id)
        : [...prev.categoryIds, id];
      return mergePickupDraft(prev, { categoryIds });
    });
  }, []);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, PICKUP_FLOW_STEP_COUNT - 1));
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const resetFlow = useCallback(() => {
    setStepIndex(0);
    setDraft(createEmptyPickupDraft());
  }, []);

  const canProceed = useMemo(
    () => canProceedPickupStep(stepId, draft),
    [draft, stepId],
  );

  return {
    stepIndex,
    stepId,
    totalSteps: PICKUP_FLOW_STEP_COUNT,
    draft,
    patchDraft,
    setCategoryIds,
    toggleCategoryId,
    goNext,
    goBack,
    resetFlow,
    canProceed,
    setStepIndex,
    setDraft,
  };
}
