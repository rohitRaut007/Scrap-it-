import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/lib/theme";
import type { PickupTimeSlot } from "@/features/pickup/constants/time-slots";

export interface TimeSlotListProps {
  slots: PickupTimeSlot[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
}

export function TimeSlotList({
  slots,
  selectedId,
  onSelectId,
}: TimeSlotListProps) {
  const { colors } = useAppTheme();

  return (
    <View>
      <Text variant="muted" className="mb-2 text-[13px] font-medium">
        Select time
      </Text>
      <View className="gap-2">
        {slots.map((slot) => {
          const disabled = Boolean(slot.full);
          const selected = selectedId === slot.id && !disabled;

          return (
            <Pressable
              key={slot.id}
              disabled={disabled}
              onPress={() => onSelectId(slot.id)}
              className={cn(
                "flex-row items-center justify-between rounded-full border px-4 py-3.5 dark:border-neutral-700",
                disabled
                  ? "border-border bg-muted/80 opacity-70 dark:border-neutral-800 dark:bg-neutral-800/60"
                  : selected
                    ? "border-primary bg-card dark:border-emerald-400 dark:bg-neutral-900"
                    : "border-border bg-card dark:bg-neutral-900",
              )}
            >
              <Text
                className={cn(
                  "flex-1 text-[15px] font-medium",
                  disabled
                    ? "text-muted-foreground dark:text-neutral-500"
                    : "text-foreground dark:text-neutral-100",
                )}
              >
                {slot.label}
              </Text>
              {disabled ? (
                <View className="rounded-full bg-muted px-2 py-0.5 dark:bg-neutral-700">
                  <Text variant="small" className="font-semibold">
                    Full
                  </Text>
                </View>
              ) : selected ? (
                <View className="size-8 items-center justify-center rounded-full bg-primary/15 dark:bg-emerald-400/20">
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.primary}
                  />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
