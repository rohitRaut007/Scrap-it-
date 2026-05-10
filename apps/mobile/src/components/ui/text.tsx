import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@/lib/cn";

const variants = {
  default: "font-sans text-base text-foreground dark:text-neutral-100",
  title: "font-bold text-2xl text-foreground tracking-tight dark:text-neutral-100",
  subtitle: "font-semibold text-lg text-foreground dark:text-neutral-100",
  lead: "font-sans text-[15px] text-muted-foreground dark:text-neutral-400",
  muted: "font-sans text-sm text-muted-foreground dark:text-neutral-400",
  small: "font-sans text-xs text-muted-foreground dark:text-neutral-400",
  label:
    "font-semibold text-xs uppercase tracking-wide text-muted-foreground dark:text-neutral-400",
};

export type TextVariant = keyof typeof variants;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
}

export function Text({
  variant = "default",
  className,
  ...props
}: TextProps) {
  return (
    <RNText
      className={cn(variants[variant], className)}
      {...props}
    />
  );
}
