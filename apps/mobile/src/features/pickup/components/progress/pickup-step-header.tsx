import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/text";
import { useAppTheme } from "@/lib/theme";

export interface PickupStepHeaderProps {
  title?: string;
  stepIndex: number;
  totalSteps: number;
  onBack?: () => void;
  className?: string;
}

export function PickupStepHeader({
  title,
  stepIndex,
  totalSteps,
  onBack,
  className,
}: PickupStepHeaderProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("pickup.header.defaultTitle");
  const filled = stepIndex + 1;
  const rest = Math.max(totalSteps - filled, 0);

  return (
    <View
      className={cn(
        "border-b border-border/50 bg-background/90 px-4 pb-3 pt-3 dark:border-neutral-800/70 dark:bg-neutral-950/90",
        className,
      )}
    >
      <View className="min-h-10 flex-row items-center gap-3">
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            className="size-10 items-center justify-center rounded-full bg-secondary/80 active:bg-secondary dark:bg-neutral-800 dark:active:bg-neutral-700"
          >
            <Ionicons name="chevron-back" size={22} color={colors.icon} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text variant="subtitle" numberOfLines={1}>
            {resolvedTitle}
          </Text>
          <Text variant="muted" numberOfLines={1}>
            {t("pickup.header.step", { current: stepIndex + 1, total: totalSteps })}
          </Text>
        </View>
      </View>
      <View className="mt-3 h-1 w-full flex-row overflow-hidden rounded-full bg-muted dark:bg-neutral-800">
        <View
          className="h-full rounded-full bg-primary dark:bg-emerald-400"
          style={{ flex: filled }}
        />
        <View style={{ flex: rest }} />
      </View>
    </View>
  );
}
