import { useEffect } from "react";
import { View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { MapScreenFallback } from "@/features/map/ui/map-screen-fallback";
import { mapTelemetry } from "@/features/map/telemetry/map-telemetry";

export function MapScreen() {
  useEffect(() => {
    mapTelemetry.trackEvent("map_screen_opened", { screen: "map", reason: "web" });
  }, []);

  return (
    <Screen scroll={false} className="pt-2">
      <View className="px-5 pb-3">
        <Text className="text-[18px] font-semibold text-foreground">Live pickup map</Text>
        <Text variant="muted" className="mt-1 text-[13px]">
          Full map view runs on the Android and iOS apps.
        </Text>
      </View>
      <MapScreenFallback
        title="Map isn’t available on web"
        description="react-native-maps is native-only. Use a dev build on a phone or emulator to see the live map, route, and markers."
      />
    </Screen>
  );
}
