import { Pressable, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";
import { Text } from "./text";

export interface ChipProps extends PressableProps {
  selected?: boolean;
  label: string;
  className?: string;
}

export function Chip({
  selected,
  label,
  className,
  ...props
}: ChipProps) {
  return (
    <Pressable
      className={cn(
        "rounded-full border px-3 py-1.5",
        selected
          ? "border-primary bg-primary/10 dark:border-emerald-400 dark:bg-emerald-400/10"
          : "border-border bg-muted/60 dark:border-neutral-800 dark:bg-neutral-800/70",
        className
      )}
      {...props}
    >
      <Text
        className={cn(
          "text-[13px] font-medium",
          selected
            ? "text-primary dark:text-emerald-300"
            : "text-foreground dark:text-neutral-100"
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
