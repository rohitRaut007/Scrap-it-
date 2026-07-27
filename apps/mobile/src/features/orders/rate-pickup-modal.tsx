import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useAppTheme } from "@/lib/theme";

export interface RatePickupModalProps {
  visible: boolean;
  submitting: boolean;
  onSubmit: (score: number, comment?: string) => void;
  onClose: () => void;
}

export function RatePickupModal({
  visible,
  submitting,
  onSubmit,
  onClose,
}: RatePickupModalProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View className="w-full max-w-md rounded-3xl border border-border bg-card p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <Text variant="subtitle" className="mb-1 text-center">
            {t("orders.detail.rating.title")}
          </Text>
          <Text variant="muted" className="mb-5 text-center text-[13px]">
            {t("orders.detail.rating.subtitle")}
          </Text>

          <View className="mb-5 flex-row justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => setScore(value)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`${value} ${t("orders.detail.rating.stars")}`}
              >
                <Ionicons
                  name={value <= score ? "star" : "star-outline"}
                  size={32}
                  color={value <= score ? colors.primary : colors.subtleIcon}
                />
              </Pressable>
            ))}
          </View>

          <TextField
            placeholder={t("orders.detail.rating.commentPlaceholder")}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            containerClassName="mb-5"
            inputClassName="min-h-[72px]"
          />

          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={onClose}
              disabled={submitting}
            >
              {t("orders.detail.rating.cancel")}
            </Button>
            <Button
              className="flex-1"
              onPress={() => onSubmit(score, comment.trim() || undefined)}
              disabled={score === 0 || submitting}
              loading={submitting}
            >
              {t("orders.detail.rating.submit")}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
