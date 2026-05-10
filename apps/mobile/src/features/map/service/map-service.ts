import { delay } from "@/lib/delay";
import type { LngLat, MapRoute, MapServiceResult } from "./map-service.types";

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(a: LngLat, b: LngLat): number {
  const earthRadiusKm = 6371;
  const latDiff = toRadians(b[1] - a[1]);
  const lonDiff = toRadians(b[0] - a[0]);
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const sinLat = Math.sin(latDiff / 2);
  const sinLon = Math.sin(lonDiff / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function interpolateRoute(origin: LngLat, destination: LngLat): LngLat[] {
  const points = 16;
  const line: LngLat[] = [];
  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    const lng = origin[0] + (destination[0] - origin[0]) * t;
    const lat = origin[1] + (destination[1] - origin[1]) * t;
    line.push([lng, lat]);
  }
  return line;
}

export const mapService = {
  async getRoute(
    origin: LngLat,
    destination: LngLat
  ): Promise<MapServiceResult<MapRoute>> {
    if (origin.length !== 2 || destination.length !== 2) {
      return {
        kind: "fatal_error",
        error: { code: "invalid_input", message: "Route points are invalid." },
      };
    }

    try {
      await delay(180);
      const distanceKm = haversineKm(origin, destination);
      const etaMinutes = Math.max(5, Math.round((distanceKm / 22) * 60));
      return {
        kind: "success",
        data: {
          coordinates: interpolateRoute(origin, destination),
          distanceKm: Number(distanceKm.toFixed(1)),
          etaMinutes,
        },
      };
    } catch {
      return {
        kind: "retriable_error",
        error: {
          code: "provider_error",
          message: "Unable to compute route right now. Please retry.",
        },
      };
    }
  },
};
