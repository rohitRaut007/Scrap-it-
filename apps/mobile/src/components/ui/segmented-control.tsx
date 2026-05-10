"use no memo";

import { Platform, Pressable, View } from "react-native";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/lib/theme";
import { Text } from "./text";

export interface SegmentedControlOption<TValue extends string> {
  value: TValue;
  label: string;
}

export interface SegmentedControlProps<TValue extends string> {
  value: TValue;
  options: ReadonlyArray<SegmentedControlOption<TValue>>;
  onChange: (value: TValue) => void;
  className?: string;
  /** Optional accessible group name (e.g. "Authentication mode"). */
  accessibilityLabel?: string;
}

export function SegmentedControl<TValue extends string>({
  value,
  options,
  onChange,
  className,
  accessibilityLabel,
}: SegmentedControlProps<TValue>) {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        "flex-row rounded-2xl bg-secondary/60 p-1 dark:bg-neutral-800",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (!active) onChange(opt.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className="flex-1 items-center rounded-xl py-2"
            style={
              active
                ? {
                    backgroundColor: isDark ? "#0a0a0a" : colors.card,
                    ...Platform.select({
                      ios: {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDark ? 0.28 : 0.06,
                        shadowRadius: 2,
                      },
                      android: { elevation: isDark ? 3 : 2 },
                      default: {},
                    }),
                  }
                : undefined
            }
          >
            <Text
              variant="small"
              className="font-semibold"
              style={{
                color: active ? colors.foreground : colors.mutedForeground,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
