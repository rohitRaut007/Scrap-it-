import { View, type ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/ui/segmented-control";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/lib/theme";
import type { SupportedLanguage } from "@/lib/i18n";

export interface LanguageToggleProps extends ViewProps {
  className?: string;
}

const LANGUAGE_OPTIONS: ReadonlyArray<
  SegmentedControlOption<SupportedLanguage>
> = [
  { value: "en", label: "EN" },
  { value: "hi", label: "हिंदी" },
  { value: "mr", label: "मराठी" },
];

export function LanguageToggle({ className, ...props }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const current = (i18n.resolvedLanguage ??
    i18n.language ??
    "en") as SupportedLanguage;

  return (
    <View
      className={cn(
        "border-b border-border py-4 dark:border-neutral-800",
        className,
      )}
      {...props}
    >
      <View className="mb-3 flex-row items-center gap-3">
        <Ionicons name="language-outline" size={20} color={colors.subtleIcon} />
        <Text className="text-[15px] text-foreground">{t("profile.language")}</Text>
      </View>
      <SegmentedControl
        value={current}
        options={LANGUAGE_OPTIONS}
        onChange={(lng) => void i18n.changeLanguage(lng)}
        accessibilityLabel={t("profile.language")}
      />
    </View>
  );
}
