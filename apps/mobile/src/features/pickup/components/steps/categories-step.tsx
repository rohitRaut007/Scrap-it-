import { useMemo } from "react";
import { View } from "react-native";
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
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  return (
    <View>
      <Text variant="title" className="mb-1 text-[22px]">
        What are you recycling?
      </Text>
      <Text variant="muted" className="mb-4 text-[15px]">
        Select one or more items
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
