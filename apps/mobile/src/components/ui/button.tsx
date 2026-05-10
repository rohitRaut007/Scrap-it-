"use no memo";

import { forwardRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/lib/theme";
import { Text } from "./text";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "default" | "sm" | "lg";

export interface ButtonProps extends PressableProps {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  loading?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
}

const sizes: Record<Size, string> = {
  sm: "px-3 py-2",
  default: "px-4 py-3.5",
  lg: "px-5 py-4",
};

const variants: Record<Variant, string> = {
  primary: "bg-primary dark:bg-emerald-400",
  secondary: "bg-secondary dark:bg-neutral-800",
  ghost: "bg-transparent",
  outline: "border border-border bg-transparent dark:border-neutral-700",
};

const textColors: Record<Variant, string> = {
  primary: "text-primary-foreground font-semibold dark:text-emerald-950",
  secondary: "text-secondary-foreground font-semibold dark:text-neutral-100",
  ghost: "text-foreground font-semibold dark:text-neutral-100",
  outline: "text-foreground font-semibold dark:text-neutral-100",
};

const textSizes: Record<Size, string> = {
  sm: "text-sm",
  default: "text-[15px]",
  lg: "text-base",
};

const iconSizes: Record<Size, number> = {
  sm: 16,
  default: 18,
  lg: 20,
};

function variantIconColor(
  variant: Variant,
  isDark: boolean,
  themeColors: ReturnType<typeof useAppTheme>["colors"],
): string {
  switch (variant) {
    case "primary":
      return isDark ? "#052e1d" : themeColors.primaryForeground;
    case "secondary":
    case "ghost":
    case "outline":
    default:
      return themeColors.foreground;
  }
}

export const Button = forwardRef<
  React.ComponentRef<typeof Pressable>,
  ButtonProps
>(function Button(
  {
    variant = "primary",
    size = "default",
    className,
    textClassName,
    children,
    disabled,
    loading,
    leftIcon,
    rightIcon,
    accessibilityState,
    ...props
  },
  ref,
) {
  const { colors, isDark } = useAppTheme();
  const isDisabled = disabled || loading;
  const iconColor = variantIconColor(variant, isDark, colors);
  const iconSize = iconSizes[size];

  const label =
    typeof children === "string" ? (
      <Text
        className={cn(textColors[variant], textSizes[size], textClassName)}
      >
        {children}
      </Text>
    ) : (
      children
    );

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        disabled: isDisabled,
        busy: loading,
      }}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-xl active:opacity-90",
        sizes[size],
        variants[variant],
        isDisabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : leftIcon ? (
        <Ionicons name={leftIcon} size={iconSize} color={iconColor} />
      ) : null}
      {label}
      {!loading && rightIcon ? (
        <Ionicons name={rightIcon} size={iconSize} color={iconColor} />
      ) : null}
      {/* keeps row height consistent on Android when only loading is shown */}
      {loading && !leftIcon && !rightIcon ? <View /> : null}
    </Pressable>
  );
});
