import { useRef, useState } from "react";
import { Dimensions, FlatList, View, type ViewToken } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { useAppTheme } from "@/lib/theme";

const { width } = Dimensions.get("window");

const slides = [
  {
    key: "1",
    title: "Professional pickups at your doorstep",
    body: "Book trusted scrap pickup partners in a few taps.",
    icon: "home-outline" as const,
  },
  {
    key: "2",
    title: "Fast booking and smart scheduling",
    body: "Select categories, choose timing, and confirm instantly.",
    icon: "calendar-outline" as const,
  },
  {
    key: "3",
    title: "Track every pickup in real time",
    body: "See driver progress and order timeline with clarity.",
    icon: "navigate-outline" as const,
  },
];

export function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const i = viewableItems[0]?.index;
      if (typeof i === "number") setIndex(i);
    }
  ).current;

  const finish = async () => {
    await authService.completeOnboarding();
    router.replace("/login");
  };

  const next = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      void finish();
    }
  };

  return (
    <Screen scroll={false} className="bg-background dark:bg-neutral-950">
      <View className="px-6 pt-2">
        <View className="items-end">
          <Button variant="ghost" size="sm" onPress={() => void finish()}>
            Skip
          </Button>
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 items-center justify-center px-8">
            <View className="mb-8 size-52 items-center justify-center rounded-full bg-primary/10 dark:bg-emerald-400/10">
              <View className="size-44 items-center justify-center rounded-full bg-card dark:bg-neutral-900">
                <Ionicons name={item.icon} size={56} color={colors.primary} />
              </View>
            </View>
            <Text variant="title" className="text-center text-[34px]">
              {item.title}
            </Text>
            <Text variant="lead" className="mt-4 text-center leading-6">
              {item.body}
            </Text>
          </View>
        )}
      />
      <View className="px-6 pb-8">
        <View className="mb-6 flex-row justify-center gap-2">
          {slides.map((s, i) => (
            <View
              key={s.key}
              className={`h-1.5 rounded-full ${
                i === index
                  ? "w-6 bg-primary dark:bg-emerald-400"
                  : "w-2 bg-muted-foreground/30 dark:bg-neutral-700"
              }`}
            />
          ))}
        </View>
        <View className="items-center">
          <Button
            onPress={next}
            className="size-14 items-center justify-center rounded-2xl p-0"
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={colors.primaryForeground}
            />
          </Button>
        </View>
      </View>
    </Screen>
  );
}
