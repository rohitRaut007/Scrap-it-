import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import type { PickupAddressOption } from "@/features/pickup/types/pickup-flow";
import { AddressOptionCard } from "@/features/pickup/components/cards/address-option-card";

export interface LocationStepProps {
  options: PickupAddressOption[];
  selectedId: string | null;
  onSelect: (option: PickupAddressOption) => void;
  onAddNew?: () => void;
}

export function LocationStep({
  options,
  selectedId,
  onSelect,
  onAddNew,
}: LocationStepProps) {
  return (
    <View>
      <Text variant="title" className="mb-1 text-[22px]">
        Pickup location
      </Text>
      <Text variant="muted" className="mb-4 text-[15px]">
        Select or add an address
      </Text>

      {options.map((option) => (
        <AddressOptionCard
          key={option.id}
          option={option}
          selected={selectedId === option.id}
          onSelect={() => onSelect(option)}
        />
      ))}

      {onAddNew ? (
        <Pressable
          onPress={onAddNew}
          className="rounded-full border border-dashed border-border bg-muted/30 px-4 py-3.5 dark:border-neutral-700 dark:bg-neutral-900/60"
        >
          <Text
            variant="muted"
            className="text-center text-[15px] font-semibold"
          >
            + Add new address
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
