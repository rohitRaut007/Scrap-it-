import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

export interface SkeletonProps extends ViewProps {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <View
      className={cn("rounded-lg bg-muted opacity-70 dark:bg-neutral-800", className)}
      {...props}
    />
  );
}
