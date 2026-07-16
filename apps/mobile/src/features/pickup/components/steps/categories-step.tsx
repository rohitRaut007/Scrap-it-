import { useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import type { Category } from "@/types/domain";
import { CategoryGridCard } from "@/features/pickup/components/cards/category-grid-card";

export interface CategoriesStepProps {
  categories: Category[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function CategoriesStep({
  categories,
  selectedIds,
  onToggle,
}: CategoriesStepProps) {
  const { t } = useTranslation();
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  return (
    <View>
      <Text variant="title" className="mb-1 text-[22px]">
        {t("pickup.categories.title")}
      </Text>
      <Text variant="muted" className="mb-4 text-[15px]">
        {t("pickup.categories.subtitle")}
      </Text>

      <View className="flex-row flex-wrap justify-between">
        {categories.map((c) => (
          <CategoryGridCard
            key={c.id}
            category={c}
            selected={selected.has(c.id)}
            onToggle={() => onToggle(c.id)}
          />
        ))}
      </View>
    </View>
  );
}
