import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

interface MapScreenFallbackProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onPress?: () => void;
}

export function MapScreenFallback({
  title,
  description,
  ctaLabel,
  onPress,
}: MapScreenFallbackProps) {
  return (
    <View className="mx-5 rounded-3xl border border-border bg-card p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <Text className="text-[16px] font-semibold text-foreground">{title}</Text>
      <Text variant="muted" className="mt-1 text-[13px]">
        {description}
      </Text>
      {ctaLabel && onPress ? (
        <Button className="mt-4 self-start" variant="secondary" onPress={onPress}>
          {ctaLabel}
        </Button>
      ) : null}
    </View>
  );
}
