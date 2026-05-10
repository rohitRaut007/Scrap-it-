import { View } from "react-native";
import { cn } from "@/lib/cn";
import { Text } from "./text";

export interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <View className={cn("items-center justify-center px-6 py-12", className)}>
      <Text variant="subtitle" className="text-center">
        {title}
      </Text>
      {description ? (
        <Text variant="muted" className="mt-2 text-center">
          {description}
        </Text>
      ) : null}
      {children ? <View className="mt-6 w-full">{children}</View> : null}
    </View>
  );
}
