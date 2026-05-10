import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/text";
import { useAppTheme } from "@/lib/theme";

const tabs: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  {
    key: "map",
    label: "Map",
    icon: "map-outline",
    iconActive: "map",
  },
  {
    key: "orders",
    label: "Orders",
    icon: "time-outline",
    iconActive: "time",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "person-outline",
    iconActive: "person",
  },
];

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View
      className="border-t border-border bg-card pt-1 dark:border-neutral-800 dark:bg-neutral-900"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row items-center justify-around px-2">
        {tabs.map((tab) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tab.key);
          const focused = state.index === routeIndex;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              onPress={() => navigation.navigate(tab.key)}
              className="min-w-[72px] flex-1 items-center py-2.5"
            >
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={22}
                color={focused ? colors.primary : colors.subtleIcon}
              />
              <Text
                className={cn(
                  "mt-0.5 text-[11px]",
                  focused
                    ? "font-semibold text-primary dark:text-emerald-300"
                    : "font-medium text-muted-foreground dark:text-neutral-400"
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
