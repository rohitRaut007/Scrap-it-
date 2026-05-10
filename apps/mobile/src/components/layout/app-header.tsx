import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/text";
import { useAppTheme } from "@/lib/theme";

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  transparent?: boolean;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
  transparent,
  className,
}: AppHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View
      className={cn(
        "flex-row items-center justify-between border-b border-border/50 px-4 py-3 dark:border-neutral-800/70",
        transparent
          ? "border-transparent bg-transparent"
          : "bg-background/90 dark:bg-neutral-950/90",
        className
      )}
    >
      <View className="min-h-10 flex-1 flex-row items-center gap-3">
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
          {title ? (
            <Text variant="subtitle" numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text variant="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}
