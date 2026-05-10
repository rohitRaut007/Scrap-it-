import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/text";
import { useAppTheme } from "@/lib/theme";
import type { Category } from "@/types/domain";
import { categoryIonicon } from "@/features/pickup/lib/category-icons";

export interface CategoryGridCardProps {
  category: Category;
  selected: boolean;
  onToggle: () => void;
}

export function CategoryGridCard({
  category,
  selected,
  onToggle,
}: CategoryGridCardProps) {
  const { colors } = useAppTheme();
  const iconName = categoryIonicon(category.iconKey);

  return (
    <Pressable
      onPress={onToggle}
      className={cn(
        "relative mb-3 min-h-[132px] flex-1 basis-[47%] rounded-3xl border p-4 dark:border-neutral-700",
        selected
          ? "border-primary bg-primary/10 dark:border-emerald-400 dark:bg-emerald-400/10"
          : "border-border bg-card dark:bg-neutral-900",
      )}
    >
      {selected ? (
        <View className="absolute right-3 top-3 size-6 items-center justify-center rounded-full bg-primary dark:bg-emerald-400">
          <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
        </View>
      ) : null}
      <View className="items-center gap-2">
        <View
          className={cn(
            "size-14 items-center justify-center rounded-full",
            selected
              ? "bg-primary dark:bg-emerald-400"
              : "bg-primary/10 dark:bg-emerald-400/15",
          )}
        >
          <Ionicons
            name={iconName}
            size={26}
            color={
              selected ? colors.primaryForeground : colors.primary
            }
          />
        </View>
        <Text className="text-center text-[15px] font-semibold text-foreground dark:text-neutral-100">
          {category.name}
        </Text>
        <Text variant="muted" className="text-center text-[13px]">
          {category.rateLabel}
        </Text>
      </View>
    </Pressable>
  );
}
