"use client";

import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  DESTINATION_COLOR,
  DESTINATION_TARGET,
  ORIGIN_COLOR,
  ORIGIN_TARGET,
  STOP_COLOR,
  type LocationPoint,
  type MapStop,
} from "@/lib/locations";
import { cn } from "@/lib/utils";
import * as React from "react";

export type { LocationPoint, MapStop };

export const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];
const DEFAULT_ZOOM = 12;

const markerIcon = (color: string, glyph: string) =>
  L.divIcon({
    className: "bg-transparent border-none",
    html: `
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="11" fill="${color}" stroke="#ffffff" stroke-width="3"/>
        <text x="14" y="14" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle" dominant-baseline="central">${glyph}</text>
      </svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const tabClass = (active: boolean) =>
  cn(
    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
    active ? "text-white" : "text-muted-foreground hover:text-foreground",
  );

const coordinatesKey = (point: LocationPoint) =>
  `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;

interface MapClickCatcherProps {
  onPick: (lat: number, lng: number) => void;
}

function MapClickCatcher({ onPick }: MapClickCatcherProps) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapFocusProps {
  activePoint: LocationPoint | null;
  route: LocationPoint[];
  routeKey: string;
}

function MapFocus({ activePoint, route, routeKey }: MapFocusProps) {
  const map = useMap();
  const last = React.useRef<string | null>(null);

  React.useEffect(() => {
    const key = activePoint ? `point:${coordinatesKey(activePoint)}` : `route:${routeKey}`;
    if (last.current === key) return;
    last.current = key;

    if (activePoint) {
      map.flyTo(
        [activePoint.lat, activePoint.lng],
        Math.max(DEFAULT_ZOOM, map.getZoom()),
      );
      return;
    }

    if (route.length > 0) {
      map.flyToBounds(
        L.latLngBounds(route.map((p) => [p.lat, p.lng] as [number, number])),
        { padding: [48, 48], maxZoom: DEFAULT_ZOOM + 4 },
      );
    }
  }, [map, activePoint, route, routeKey]);

  return null;
}

interface NominatimAddress {
  road?: string;
  footway?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
    const address = data?.address as NominatimAddress | undefined;
    const concise = address
      ? [
          address.road ?? address.footway ?? address.pedestrian,
          address.neighbourhood ?? address.suburb ?? address.quarter,
          address.city_district ?? address.city ?? address.town ?? address.village,
          address.state,
        ]
          .filter(Boolean)
          .join(", ")
      : "";
    if (concise) return concise;
    if (typeof data?.display_name === "string" && data.display_name) {
      return data.display_name;
    }
  } catch {
    // fall through to coordinate fallback
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

interface DraggableMarkerProps {
  point: LocationPoint;
  color: string;
  glyph: string;
  onChange: (point: LocationPoint) => void;
}

function DraggableMarker({ point, color, glyph, onChange }: DraggableMarkerProps) {
  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={markerIcon(color, glyph)}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          reverseGeocode(lat, lng).then((address) => onChange({ lat, lng, address }));
        },
      }}
    />
  );
}

export interface DhakaLocationMapProps {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  stops?: MapStop[];
  activeTarget: string;
  onActiveTargetChange: (target: string) => void;
  onOriginSelect: (point: LocationPoint) => void;
  onDestinationSelect: (point: LocationPoint) => void;
  onStopSelect: (stopId: string, point: LocationPoint) => void;
}

export function DhakaLocationMap({
  origin,
  destination,
  stops = [],
  activeTarget,
  onActiveTargetChange,
  onOriginSelect,
  onDestinationSelect,
  onStopSelect,
}: DhakaLocationMapProps) {
  const route = React.useMemo(
    () =>
      [origin, ...stops.map((s) => s.point), destination].filter(
        (point): point is LocationPoint => point !== null,
      ),
    [origin, stops, destination],
  );
  const routeKey = route.map(coordinatesKey).join("|");

  const activePoint = React.useMemo(() => {
    if (activeTarget === ORIGIN_TARGET) return origin;
    if (activeTarget === DESTINATION_TARGET) return destination;
    return stops.find((s) => s.id === activeTarget)?.point ?? null;
  }, [activeTarget, origin, destination, stops]);

  const handleMapPick = (lat: number, lng: number) => {
    reverseGeocode(lat, lng).then((address) => {
      const point = { lat, lng, address };
      if (activeTarget === ORIGIN_TARGET) onOriginSelect(point);
      else if (activeTarget === DESTINATION_TARGET) onDestinationSelect(point);
      else onStopSelect(activeTarget, point);
    });
  };

  const targetLabel = React.useMemo(() => {
    if (activeTarget === ORIGIN_TARGET) return "origin / pickup";
    if (activeTarget === DESTINATION_TARGET) return "destination / drop-off";
    const index = stops.findIndex((s) => s.id === activeTarget);
    return index === -1 ? "the selected point" : `stop ${index + 1}`;
  }, [activeTarget, stops]);

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Tap the map to drop{" "}
          <span className="font-medium text-foreground">{targetLabel}</span>
          {!activePoint && " — then drag the marker to fine-tune"}
        </p>
        <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => onActiveTargetChange(ORIGIN_TARGET)}
            style={activeTarget === ORIGIN_TARGET ? { backgroundColor: ORIGIN_COLOR } : undefined}
            className={tabClass(activeTarget === ORIGIN_TARGET)}
          >
            A · Origin
          </button>
          {stops.map((stop, idx) => (
            <button
              key={stop.id}
              type="button"
              onClick={() => onActiveTargetChange(stop.id)}
              style={activeTarget === stop.id ? { backgroundColor: STOP_COLOR } : undefined}
              className={cn(tabClass(activeTarget === stop.id), !stop.point && "opacity-70")}
            >
              Stop {idx + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onActiveTargetChange(DESTINATION_TARGET)}
            style={activeTarget === DESTINATION_TARGET ? { backgroundColor: DESTINATION_COLOR } : undefined}
            className={tabClass(activeTarget === DESTINATION_TARGET)}
          >
            B · Destination
          </button>
        </div>
      </div>

      <MapContainer
        center={DHAKA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: 360, width: "100%", borderRadius: 12, zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickCatcher onPick={handleMapPick} />
        <MapFocus activePoint={activePoint} route={route} routeKey={routeKey} />
        {route.length > 1 && (
          <Polyline
            positions={route.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: "#0f172a", weight: 3, opacity: 0.55, dashArray: "6 6" }}
          />
        )}
        {origin && (
          <DraggableMarker
            point={origin}
            color={ORIGIN_COLOR}
            glyph="A"
            onChange={onOriginSelect}
          />
        )}
        {stops.map((stop, idx) =>
          stop.point ? (
            <DraggableMarker
              key={stop.id}
              point={stop.point}
              color={STOP_COLOR}
              glyph={String(idx + 1)}
              onChange={(point) => onStopSelect(stop.id, point)}
            />
          ) : null,
        )}
        {destination && (
          <DraggableMarker
            point={destination}
            color={DESTINATION_COLOR}
            glyph="B"
            onChange={onDestinationSelect}
          />
        )}
      </MapContainer>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-500" /> A · Origin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-500" /> Stops
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-blue-500" /> B · Destination
        </span>
        {route.length > 1 && (
          <span>Drag any marker to adjust — coordinates update automatically</span>
        )}
      </div>
    </div>
  );
}