export type LngLat = [number, number];

export interface MapRoute {
  coordinates: LngLat[];
  etaMinutes: number;
  distanceKm: number;
}

export type MapServiceErrorCode =
  | "missing_configuration"
  | "network_unavailable"
  | "provider_error"
  | "invalid_input";

export interface MapServiceError {
  code: MapServiceErrorCode;
  message: string;
}

export type MapServiceResult<T> =
  | { kind: "success"; data: T }
  | { kind: "retriable_error"; error: MapServiceError }
  | { kind: "fatal_error"; error: MapServiceError };
