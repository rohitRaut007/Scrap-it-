import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useMapScreenState } from "@/features/map/state/use-map-screen-state";
import { MapScreenFallback } from "@/features/map/ui/map-screen-fallback";
import type { LngLat } from "@/features/map/service/map-service.types";
import { mapTelemetry } from "@/features/map/telemetry/map-telemetry";

const agentPoints: LngLat[] = [
  [72.8705, 19.0735],
  [72.8723, 19.0748],
  [72.8752, 19.0715],
  [72.8784, 19.0776],
  [72.8811, 19.0785],
  [72.8835, 19.0734],
];

export function MapScreen() {
  const { loadState, origin, destination, route, errorMessage, cameraCenter, reload } =
    useMapScreenState();
  const lastSentAtRef = useRef(0);

  const routeCoordinates = useMemo(
    () => route?.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })) ?? [],
    [route]
  );

  useEffect(() => {
    mapTelemetry.trackEvent("map_screen_opened", { screen: "map" });
  }, []);

  return (
    <Screen scroll={false} className="pt-2">
      <View className="px-5 pb-3">
        <Text className="text-[18px] font-semibold text-foreground">
          Live pickup map
        </Text>
        <Text variant="muted" className="mt-1 text-[13px]">
          {route
            ? `ETA ${route.etaMinutes} min • ${route.distanceKm} km`
            : "Preparing route and nearby agents"}
        </Text>
      </View>

      {loadState === "permission_denied" ? (
        <MapScreenFallback
          title="Location permission is off"
          description="Enable location permission to see your live position and route updates."
          ctaLabel="Try again"
          onPress={reload}
        />
      ) : null}

      {loadState === "error" ? (
        <MapScreenFallback
          title="Map is temporarily unavailable"
          description={errorMessage ?? "We could not load route data right now."}
          ctaLabel="Retry"
          onPress={reload}
        />
      ) : null}

      <View className="mx-5 mt-4 flex-1 overflow-hidden rounded-3xl">
        <MapView
          style={{ flex: 1 }}
          showsCompass
          showsMyLocationButton
          showsUserLocation={Boolean(origin)}
          initialRegion={{
            latitude: cameraCenter[1],
            longitude: cameraCenter[0],
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          onUserLocationChange={() => {
            const now = Date.now();
            if (now - lastSentAtRef.current < 5000) {
              return;
            }
            lastSentAtRef.current = now;
            mapTelemetry.trackEvent("location_update_throttled", { screen: "map" });
          }}
        >
          <Marker
            coordinate={{
              latitude: destination[1],
              longitude: destination[0],
            }}
            title="Destination"
          />
          {agentPoints.map(([longitude, latitude], index) => (
            <Marker
              key={`agent-${index}`}
              coordinate={{ latitude, longitude }}
              title={`Agent ${index + 1}`}
              pinColor="#4a9f7a"
            />
          ))}
          {routeCoordinates.length > 1 ? (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#4a9f7a"
              strokeWidth={4}
            />
          ) : null}
        </MapView>
      </View>
    </Screen>
  );
}
