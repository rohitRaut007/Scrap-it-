import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { formatScheduleDateHeading } from "@/features/pickup/lib/schedule-date-utils";

export interface DateScrollRowProps {
  dateKeys: string[];
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  now?: Date;
}

export function DateScrollRow({
  dateKeys,
  selectedKey,
  onSelectKey,
  now = new Date(),
}: DateScrollRowProps) {
  return (
    <View>
      <Text variant="muted" className="mb-2 text-[13px] font-medium">
        Select date
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pb-1"
      >
        {dateKeys.map((key) => {
          const selected = selectedKey === key;
          const heading = formatScheduleDateHeading(key, now);
          const d = new Date(key + "T12:00:00");
          const dayNum = d.getDate();
          const month = d.toLocaleDateString(undefined, { month: "short" });

          return (
            <Pressable
              key={key}
              onPress={() => onSelectKey(key)}
              className={cn(
                "min-w-[92px] rounded-2xl border px-3 py-3 dark:border-neutral-700",
                selected
                  ? "border-primary bg-primary dark:border-emerald-400 dark:bg-emerald-400"
                  : "border-border bg-card dark:bg-neutral-900",
              )}
            >
              <Text
                className={cn(
                  "text-center text-[12px] font-medium",
                  selected
                    ? "text-primary-foreground dark:text-emerald-950"
                    : "text-muted-foreground dark:text-neutral-400",
                )}
              >
                {heading}
              </Text>
              <Text
                className={cn(
                  "mt-1 text-center text-xl font-bold",
                  selected
                    ? "text-primary-foreground dark:text-emerald-950"
                    : "text-foreground dark:text-neutral-100",
                )}
              >
                {dayNum}
              </Text>
              <Text
                className={cn(
                  "text-center text-[12px]",
                  selected
                    ? "text-primary-foreground/90 dark:text-emerald-950/90"
                    : "text-muted-foreground dark:text-neutral-400",
                )}
              >
                {month}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
