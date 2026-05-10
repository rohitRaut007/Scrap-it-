import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

export interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/20",
        className
      )}
      {...props}
    />
  );
}
