export interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
}

/** A stop may exist before it has been placed on the map. */
export interface MapStop {
  id: string;
  point: LocationPoint | null;
}

export interface LocationField {
  address: string;
  point: LocationPoint | null;
}

export const ORIGIN_TARGET = "origin";
export const DESTINATION_TARGET = "destination";

export const ORIGIN_COLOR = "#10b981";
export const STOP_COLOR = "#f59e0b";
export const DESTINATION_COLOR = "#3b82f6";

export const formatCoordinates = (point: LocationPoint) =>
  `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;