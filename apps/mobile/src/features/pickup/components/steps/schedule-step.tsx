import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { DateScrollRow } from "@/features/pickup/components/selectors/date-scroll-row";
import { TimeSlotList } from "@/features/pickup/components/selectors/time-slot-list";
import { PICKUP_TIME_SLOTS } from "@/features/pickup/constants/time-slots";

export interface ScheduleStepProps {
  dateKeys: string[];
  scheduleDateKey: string | null;
  selectedTimeSlotId: string | null;
  onDateKey: (key: string) => void;
  onTimeSlotId: (id: string) => void;
}

export function ScheduleStep({
  dateKeys,
  scheduleDateKey,
  selectedTimeSlotId,
  onDateKey,
  onTimeSlotId,
}: ScheduleStepProps) {
  return (
    <View>
      <Text variant="title" className="mb-1 text-[22px]">
        When should we come?
      </Text>
      <Text variant="muted" className="mb-5 text-[15px]">
        Pick a date and time
      </Text>

      <DateScrollRow
        dateKeys={dateKeys}
        selectedKey={scheduleDateKey}
        onSelectKey={onDateKey}
      />

      <View className="h-6" />

      <TimeSlotList
        slots={PICKUP_TIME_SLOTS}
        selectedId={selectedTimeSlotId}
        onSelectId={onTimeSlotId}
      />
    </View>
  );
}
