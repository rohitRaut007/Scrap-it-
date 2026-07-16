import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppTabBar } from "@/components/layout/app-tab-bar";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="map" options={{ title: t("tabs.map") }} />
      <Tabs.Screen name="orders" options={{ title: t("tabs.orders") }} />
      <Tabs.Screen name="profile" options={{ title: t("tabs.profile") }} />
    </Tabs>
  );
}
