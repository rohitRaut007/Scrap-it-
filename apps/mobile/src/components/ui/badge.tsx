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
  default: "bg-primary/15 dark:bg-emerald-400/15",
  success: "bg-emerald-500/15",
  warning: "bg-amber-500/15",
  neutral: "bg-muted dark:bg-neutral-800",
};

const textTones: Record<BadgeTone, string> = {
  default: "text-primary dark:text-emerald-300",
  success: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-800 dark:text-amber-300",
  neutral: "text-muted-foreground dark:text-neutral-300",
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
