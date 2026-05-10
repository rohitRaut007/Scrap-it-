import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/lib/theme";
import type { PickupAddressOption } from "@/features/pickup/types/pickup-flow";

export interface AddressOptionCardProps {
  option: PickupAddressOption;
  selected: boolean;
  onSelect: () => void;
}

export function AddressOptionCard({
  option,
  selected,
  onSelect,
}: AddressOptionCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onSelect}
      className={cn(
        "mb-3 flex-row items-start gap-3 rounded-2xl border p-4 dark:border-neutral-700",
        selected
          ? "border-primary bg-primary/10 dark:border-emerald-400 dark:bg-emerald-400/10"
          : "border-border bg-card dark:bg-neutral-900",
      )}
    >
      <View
        className={cn(
          "size-11 items-center justify-center rounded-full",
          selected
            ? "bg-primary dark:bg-emerald-400"
            : "bg-muted dark:bg-neutral-800",
        )}
      >
        <Ionicons
          name="location-sharp"
          size={22}
          color={selected ? colors.primaryForeground : colors.subtleIcon}
        />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-[15px] font-semibold text-foreground dark:text-neutral-100">
            {option.label}
          </Text>
          {option.isDefault ? (
            <Badge label="Default" tone="neutral" />
          ) : null}
        </View>
        <Text variant="muted" className="mt-1 text-[13px] leading-snug">
          {option.line}
        </Text>
      </View>
      {selected ? (
        <View className="size-8 items-center justify-center rounded-full bg-primary dark:bg-emerald-400">
          <Ionicons name="checkmark" size={18} color={colors.primaryForeground} />
        </View>
      ) : null}
    </Pressable>
  );
}
