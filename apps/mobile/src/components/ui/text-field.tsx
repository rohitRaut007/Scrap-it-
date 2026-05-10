import { forwardRef, useState } from "react";
import {
  Pressable,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/lib/theme";
import { Text } from "./text";

export interface TextFieldProps extends Omit<TextInputProps, "className"> {
  label?: string;
  error?: string | null;
  hint?: string;
  /** When there is no hint/error, keeps this much vertical space (e.g. to match another mode’s hint). */
  reserveAccessoryHeight?: number;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Reveal toggle for password fields. Pairs with `secureTextEntry`. */
  toggleSecure?: boolean;
  containerClassName?: string;
  inputClassName?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    error,
    hint,
    reserveAccessoryHeight,
    leftIcon,
    toggleSecure,
    secureTextEntry,
    containerClassName,
    inputClassName,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSecure = secureTextEntry && !revealed;

  return (
    <View className={cn("gap-1.5", containerClassName)}>
      {label ? (
        <Text variant="small" className="font-medium text-foreground">
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          "flex-row items-center gap-2 rounded-2xl border bg-card px-3.5 dark:bg-neutral-900",
          focused
            ? "border-primary/60 dark:border-emerald-400/60"
            : "border-border dark:border-neutral-800",
          error ? "border-destructive/70 dark:border-red-400/70" : null,
        )}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? colors.primary : colors.subtleIcon}
          />
        ) : null}
        <TextInput
          ref={ref}
          secureTextEntry={isSecure}
          placeholderTextColor={colors.mutedForeground}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            "flex-1 py-3.5 text-[15px] text-foreground dark:text-neutral-100",
            inputClassName,
          )}
          {...props}
        />
        {toggleSecure && secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={revealed ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.subtleIcon}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="small" className="text-destructive dark:text-red-400">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small">{hint}</Text>
      ) : reserveAccessoryHeight != null ? (
        <View style={{ height: reserveAccessoryHeight }} />
      ) : null}
    </View>
  );
});
