import { useCallback, useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { delay } from "@/lib/delay";
import { mapService } from "@/features/map/service/map-service";
import type { LngLat, MapRoute } from "@/features/map/service/map-service.types";
import { mapTelemetry } from "@/features/map/telemetry/map-telemetry";

const defaultDestination: LngLat = [72.8777, 19.076];
const fallbackCenter: LngLat = [72.8732, 19.0704];

type LoadState = "loading" | "ready" | "permission_denied" | "error";

export function useMapScreenState() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [origin, setOrigin] = useState<LngLat | null>(null);
  const [route, setRoute] = useState<MapRoute | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRouteWithRetry = useCallback(async (start: LngLat) => {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const routeResult = await mapService.getRoute(start, defaultDestination);
      if (routeResult.kind === "success") {
        setRoute(routeResult.data);
        setErrorMessage(null);
        mapTelemetry.trackEvent("route_loaded", { screen: "map" });
        return true;
      }
      if (routeResult.kind === "fatal_error") {
        setErrorMessage(routeResult.error.message);
        mapTelemetry.trackError(routeResult.error, {
          screen: "map",
          reason: routeResult.error.code,
        });
        return false;
      }
      if (attempt < maxAttempts) {
        await delay(200 * attempt);
      } else {
        setErrorMessage(routeResult.error.message);
        mapTelemetry.trackError(routeResult.error, {
          screen: "map",
          reason: routeResult.error.code,
        });
      }
    }
    return false;
  }, []);

  const load = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLoadState("permission_denied");
        setOrigin(null);
        setRoute(null);
        mapTelemetry.trackEvent("location_permission_denied", { screen: "map" });
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const userCoord: LngLat = [current.coords.longitude, current.coords.latitude];
      setOrigin(userCoord);
      const routeOk = await fetchRouteWithRetry(userCoord);
      setLoadState(routeOk ? "ready" : "error");
    } catch (error) {
      setLoadState("error");
      setOrigin(null);
      setRoute(null);
      setErrorMessage("Unable to load live map right now. Please try again.");
      mapTelemetry.trackError(error, { screen: "map", reason: "load_failed" });
    }
  }, [fetchRouteWithRetry]);

  useEffect(() => {
    void load();
  }, [load]);

  const cameraCenter = useMemo<LngLat>(() => {
    if (origin) {
      return origin;
    }
    return fallbackCenter;
  }, [origin]);

  return {
    loadState,
    origin,
    destination: defaultDestination,
    route,
    errorMessage,
    cameraCenter,
    reload: load,
  };
}
