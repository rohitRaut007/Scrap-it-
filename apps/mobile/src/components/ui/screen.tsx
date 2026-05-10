import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, type ScrollViewProps } from "react-native";
import { cn } from "@/lib/cn";

export interface ScreenProps extends ScrollViewProps {
  safe?: boolean;
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export function Screen({
  safe = true,
  scroll = true,
  className,
  contentClassName,
  children,
  ...scrollProps
}: ScreenProps) {
  const inner = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={cn("flex-grow pb-6", contentClassName)}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  const wrapClass = cn("flex-1 bg-background dark:bg-neutral-950", className);

  if (safe) {
    return (
      <SafeAreaView className={wrapClass} edges={["top", "left", "right"]}>
        {inner}
      </SafeAreaView>
    );
  }

  return <View className={wrapClass}>{inner}</View>;
}
