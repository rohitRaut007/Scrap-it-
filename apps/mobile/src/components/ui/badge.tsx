import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";
import { Text } from "./text";

export type BadgeTone = "default" | "success" | "warning" | "neutral";

export interface BadgeProps extends ViewProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  // Scrap-it Paper tones — match apps/admin + apps/collector order-utils:
  // default (scheduled/assigned) → rust, warning (en route) → signal,
  // success (completed) → cash, neutral (cancelled) → muted.
  default: "bg-rust/15",
  success: "bg-cash/15",
  warning: "bg-signal/30",
  neutral: "bg-muted",
};

const textTones: Record<BadgeTone, string> = {
  default: "text-rust",
  success: "text-cash",
  warning: "text-ink",
  neutral: "text-muted-foreground",
};

export function Badge({
  label,
  tone = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <View
      className={cn(
        "self-start rounded-full px-2.5 py-1",
        tones[tone],
        className
      )}
      {...props}
    >
      <Text className={cn("text-[11px] font-semibold", textTones[tone])}>
        {label}
      </Text>
    </View>
  );
}
