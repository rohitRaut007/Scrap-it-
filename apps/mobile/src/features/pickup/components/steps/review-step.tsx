import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { useAppTheme } from "@/lib/theme";
import type { Category } from "@/types/domain";
import type { PickupFlowDraft } from "@/features/pickup/types/pickup-flow";
import { formatReviewSchedule } from "@/features/pickup/lib/review-formatters";

export interface ReviewStepProps {
  draft: PickupFlowDraft;
  categories: Category[];
}

export function ReviewStep({ draft, categories }: ReviewStepProps) {
  const { colors } = useAppTheme();
  const names = new Map(categories.map((c) => [c.id, c.name] as const));
  const schedule = formatReviewSchedule(
    draft.scheduledAtIso,
    draft.selectedTimeSlotId,
  );

  return (
    <View>
      <Text variant="title" className="mb-1 text-[22px]">
        Review your request
      </Text>
      <Text variant="muted" className="mb-4 text-[15px]">
        Make sure everything looks good
      </Text>

      <Card className="gap-0 overflow-hidden p-0">
        <View className="border-b border-border/70 p-4 dark:border-neutral-800">
          <Text variant="label" className="mb-2">
            Items
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {draft.categoryIds.map((id) => {
              const label = names.get(id) ?? id;
              return (
                <View
                  key={id}
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 dark:border-emerald-400/25 dark:bg-emerald-400/10"
                >
                  <Text className="text-[13px] font-medium text-primary dark:text-emerald-300">
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="border-b border-border/70 p-4 dark:border-neutral-800">
          <Text variant="label" className="mb-2">
            Schedule
          </Text>
          <View className="flex-row items-start gap-3">
            <View className="size-10 items-center justify-center rounded-full bg-primary/15 dark:bg-emerald-400/15">
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[15px] font-semibold text-foreground dark:text-neutral-100">
                {schedule.title}
              </Text>
              <Text variant="muted" className="mt-0.5 text-[13px]">
                {schedule.subtitle}
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4">
          <Text variant="label" className="mb-2">
            Address
          </Text>
          <View className="flex-row items-start gap-3">
            <View className="size-10 items-center justify-center rounded-full bg-primary/15 dark:bg-emerald-400/15">
              <Ionicons
                name="location-sharp"
                size={20}
                color={colors.primary}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[15px] font-semibold text-foreground dark:text-neutral-100">
                {draft.addressLabel || "Address"}
              </Text>
              <Text
                variant="muted"
                className="mt-0.5 text-[13px] leading-snug"
                numberOfLines={2}
              >
                {draft.addressLine}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <View className="mt-4 flex-row gap-3 rounded-2xl border border-signal/40 bg-signal/15 p-3">
        <View className="size-9 items-center justify-center rounded-full bg-signal/30">
          <Ionicons
            name="warning-outline"
            size={20}
            color={colors.subtleIcon}
          />
        </View>
        <Text variant="muted" className="flex-1 text-[13px] leading-snug">
          Final amount will be calculated after weighing at pickup.
        </Text>
      </View>
    </View>
  );
}
