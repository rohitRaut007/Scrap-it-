import { useState } from "react";
import { Pressable, View, type PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/lib/theme";

export interface ThemeToggleProps extends Omit<PressableProps, "onPress"> {
  className?: string;
}

export function ThemeToggle({ className, ...props }: ThemeToggleProps) {
  const { colors, isDark, theme, toggleTheme } = useAppTheme();
  const [busy, setBusy] = useState(false);

  const onToggle = async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      await toggleTheme();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark, disabled: busy }}
      onPress={() => void onToggle()}
      disabled={busy}
      className={cn(
        "flex-row items-center justify-between border-b border-border py-4 active:bg-muted/50 dark:border-neutral-800 dark:active:bg-neutral-800/70",
        busy && "opacity-70",
        className
      )}
      {...props}
    >
      <View className="flex-row items-center gap-3">
        <Ionicons
          name={isDark ? "moon" : "sunny-outline"}
          size={20}
          color={colors.subtleIcon}
        />
        <View>
          <Text className="text-[15px] text-foreground">Theme</Text>
          <Text variant="small" className="mt-0.5 capitalize">
            {theme} mode
          </Text>
        </View>
      </View>

      <View
        className={cn(
          "h-7 w-12 rounded-full p-0.5",
          isDark ? "bg-emerald-400" : "bg-muted"
        )}
      >
        <View
          className={cn(
            "size-6 rounded-full bg-card shadow-sm dark:bg-neutral-950"
          )}
          style={{ transform: [{ translateX: isDark ? 20 : 0 }] }}
        />
      </View>
    </Pressable>
  );
}
