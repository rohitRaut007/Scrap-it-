"use no memo";

import { Image, type ImageStyle } from "expo-image";
import { type StyleProp } from "react-native";
import { cn } from "@/lib/cn";

const LOGO_SOURCE = require("../../../assets/images/logo.png");

export interface LogoProps {
  /** Square render size in px. Default 96. */
  size?: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
  /** Override the default a11y label. */
  accessibilityLabel?: string;
}

/**
 * Brand mark for Scrap-it. Single source of truth for the logo asset so the
 * splash, auth, and any future branded screens stay visually consistent.
 */
export function Logo({
  size = 96,
  className,
  style,
  accessibilityLabel = "Scrap-it",
}: LogoProps) {
  return (
    <Image
      source={LOGO_SOURCE}
      contentFit="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className={cn(className)}
      style={[{ width: size, height: size }, style]}
    />
  );
}
