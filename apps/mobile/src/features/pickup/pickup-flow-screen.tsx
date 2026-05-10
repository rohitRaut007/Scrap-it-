import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Button } from "@/components/ui/button";
import { CategoriesStep } from "@/features/pickup/components/steps/categories-step";
import { ScheduleStep } from "@/features/pickup/components/steps/schedule-step";
import { PickupSuccessModal } from "@/features/pickup/components/scheduling/pickup-success-modal";
import { PhotosStep } from "@/features/pickup/components/steps/photos-step";
import { LocationStep } from "@/features/pickup/components/steps/location-step";
import { ReviewStep } from "@/features/pickup/components/steps/review-step";
import { PickupStepHeader } from "@/features/pickup/components/progress/pickup-step-header";
import { buildPickupAddressOptions } from "@/features/pickup/constants/pickup-addresses";
import { PICKUP_TIME_SLOTS } from "@/features/pickup/constants/time-slots";
import {
  mergePickupDraft,
  usePickupFlow,
} from "@/features/pickup/hooks/use-pickup-flow";
import { upcomingDateKeys } from "@/features/pickup/lib/schedule-date-utils";
import { addressService } from "@/services/addressService";
import { categoryService } from "@/services/categoryService";
import { pickupService } from "@/services/pickupService";
import type {
  AddressSummary,
  Category,
  PickupOrder,
} from "@/types/domain";

export function PickupFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const initialPrefill = useMemo(
    () => (categoryId ? [categoryId] : undefined),
    [categoryId],
  );

  const {
    stepIndex,
    stepId,
    totalSteps,
    draft,
    patchDraft,
    toggleCategoryId,
    goNext,
    goBack,
    canProceed,
    setDraft,
  } = usePickupFlow(initialPrefill);

  const [categories, setCategories] = useState<Category[]>([]);
  const [addresses, setAddresses] = useState<AddressSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [successOrder, setSuccessOrder] = useState<PickupOrder | null>(null);

  useEffect(() => {
    void categoryService.list().then(setCategories);
  }, []);

  const refreshAddresses = useCallback(() => {
    return addressService
      .list()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshAddresses();
    }, [refreshAddresses]),
  );

  useEffect(() => {
    if (!categoryId || !categories.length) return;
    if (!categories.some((c) => c.id === categoryId)) return;
    setDraft((prev) => {
      if (prev.categoryIds.includes(categoryId)) return prev;
      return mergePickupDraft(prev, {
        categoryIds: [...prev.categoryIds, categoryId],
      });
    });
  }, [categories, categoryId, setDraft]);

  const dateKeys = useMemo(() => upcomingDateKeys(new Date(), 7), []);

  const addressOptions = useMemo(
    () => buildPickupAddressOptions(addresses),
    [addresses],
  );

  useEffect(() => {
    if (!addressOptions.length) {
      if (draft.addressId) {
        patchDraft({ addressId: null, addressLabel: "", addressLine: "" });
      }
      return;
    }
    const stillValid = addressOptions.some((o) => o.id === draft.addressId);
    if (stillValid) return;
    const def =
      addressOptions.find((o) => o.isDefault) ?? addressOptions[0];
    patchDraft({
      addressId: def.id,
      addressLine: def.line,
      addressLabel: def.label,
    });
  }, [addressOptions, draft.addressId, patchDraft]);

  useEffect(() => {
    if (stepId !== "schedule") return;
    if (draft.scheduleDateKey) return;
    const firstDate = dateKeys[0];
    const firstSlot = PICKUP_TIME_SLOTS.find((s) => !s.full);
    if (firstDate && firstSlot) {
      patchDraft({
        scheduleDateKey: firstDate,
        selectedTimeSlotId: firstSlot.id,
      });
    }
  }, [dateKeys, draft.scheduleDateKey, patchDraft, stepId]);

  const handleHeaderBack = useCallback(() => {
    if (stepIndex === 0) router.back();
    else goBack();
  }, [goBack, router, stepIndex]);

  const onContinue = useCallback(() => {
    if (!canProceed) return;
    goNext();
  }, [canProceed, goNext]);

  const submit = useCallback(async () => {
    if (!draft.scheduledAtIso || !draft.addressId) return;
    setBusy(true);
    try {
      const photoStorageKeys = draft.photos
        .filter((p) => p.status === "uploaded" && p.storageKey)
        .map((p) => p.storageKey as string);
      const order = await pickupService.schedulePickup({
        categoryIds: draft.categoryIds,
        addressId: draft.addressId,
        scheduledAt: draft.scheduledAtIso,
        photoStorageKeys: photoStorageKeys.length
          ? photoStorageKeys
          : undefined,
      });
      setSuccessOrder(order);
    } catch (error) {
      console.warn("schedulePickup failed", error);
      Alert.alert(
        "Could not schedule pickup",
        "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }, [draft]);

  const successId = successOrder?.id;

  const onTrack = useCallback(() => {
    setSuccessOrder(null);
    if (successId) router.replace(`/order/${successId}`);
  }, [router, successId]);

  return (
    <View
      className="flex-1 bg-background dark:bg-neutral-950"
      style={{ paddingTop: insets.top }}
    >
      <PickupStepHeader
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        onBack={handleHeaderBack}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {stepId === "categories" ? (
          <CategoriesStep
            categories={categories}
            selectedIds={draft.categoryIds}
            onToggle={toggleCategoryId}
          />
        ) : null}

        {stepId === "photos" ? (
          <PhotosStep
            photos={draft.photos}
            onChangePhotos={(photos) => patchDraft({ photos })}
          />
        ) : null}

        {stepId === "schedule" ? (
          <ScheduleStep
            dateKeys={dateKeys}
            scheduleDateKey={draft.scheduleDateKey}
            selectedTimeSlotId={draft.selectedTimeSlotId}
            onDateKey={(scheduleDateKey) => patchDraft({ scheduleDateKey })}
            onTimeSlotId={(selectedTimeSlotId) =>
              patchDraft({ selectedTimeSlotId })
            }
          />
        ) : null}

        {stepId === "location" ? (
          <LocationStep
            options={addressOptions}
            selectedId={draft.addressId}
            onSelect={(option) =>
              patchDraft({
                addressId: option.id,
                addressLine: option.line,
                addressLabel: option.label,
              })
            }
            onAddNew={() => router.push("/saved-addresses/new")}
          />
        ) : null}

        {stepId === "review" ? (
          <ReviewStep draft={draft} categories={categories} />
        ) : null}
      </ScrollView>

      <View
        className="border-t border-border/60 bg-background px-5 pt-3 dark:border-neutral-800 dark:bg-neutral-950"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {stepId === "review" ? (
          <Button disabled={busy} loading={busy} onPress={() => void submit()}>
            Confirm pickup
          </Button>
        ) : (
          <Button disabled={!canProceed} onPress={onContinue}>
            Continue
          </Button>
        )}
      </View>

      <PickupSuccessModal
        visible={successOrder != null}
        pickupCode={successOrder?.id ?? ""}
        onTrack={onTrack}
      />
    </View>
  );
}
