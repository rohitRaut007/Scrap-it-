import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@/lib/cn";

// Scrap-it Paper type roles: display = Rozha One (headlines),
// body = Hind, mono = IBM Plex Mono (labels/data).
const variants = {
  default: "font-sans text-base text-foreground",
  title: "font-display text-2xl text-foreground tracking-tight",
  subtitle: "font-semibold text-lg text-foreground",
  lead: "font-sans text-[15px] text-muted-foreground",
  muted: "font-sans text-sm text-muted-foreground",
  small: "font-sans text-xs text-muted-foreground",
  label:
    "font-mono text-xs uppercase tracking-widest text-muted-foreground",
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
