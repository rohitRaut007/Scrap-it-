import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { useAppTheme } from "@/lib/theme";

interface DirectBookingBannerProps {
  collectorName: string | null;
  onRemove: () => void;
}

/**
 * Shown throughout the pickup flow when the customer arrived via a
 * collector's QR/booking link — makes the guaranteed-assignment behavior
 * transparent instead of silently overriding the usual open-pool matching.
 */
export function DirectBookingBanner({
  collectorName,
  onRemove,
}: DirectBookingBannerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <View className="mb-3 flex-row items-start gap-2.5 rounded-2xl bg-cash/15 px-3.5 py-3">
      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
      <View className="flex-1">
        <Text className="text-[13px] font-semibold text-ink">
          {collectorName
            ? t("pickup.directBooking.bannerTitle", { name: collectorName })
            : t("pickup.directBooking.bannerTitleFallback")}
        </Text>
        <Text variant="small" className="mt-0.5 leading-4">
          {t("pickup.directBooking.bannerSubtitle")}
        </Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8} className="p-0.5">
        <Ionicons name="close" size={16} color={colors.subtleIcon} />
      </Pressable>
    </View>
  );
}
