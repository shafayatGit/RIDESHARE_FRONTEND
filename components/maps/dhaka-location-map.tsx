"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
}

export const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];
const DEFAULT_ZOOM = 12;

const markerIcon = (color: string) =>
  L.divIcon({
    className: "bg-transparent border-none",
    html: `
      <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="13" r="10" fill="${color}" stroke="#ffffff" stroke-width="3"/>
      </svg>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

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

function FlyTo({ point }: { point: LocationPoint | null }) {
  const map = useMap();
  const last = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!point) return;
    const key = point.lat * 1000 + point.lng;
    if (last.current === key) return;
    last.current = key;
    map.flyTo([point.lat, point.lng], Math.max(DEFAULT_ZOOM, map.getZoom()));
  }, [map, point]);
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    );
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
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
  onChange: (point: LocationPoint) => void;
}

function DraggableMarker({ point, color, onChange }: DraggableMarkerProps) {
  const setFromLatLng = (lat: number, lng: number) => {
    reverseGeocode(lat, lng).then((address) => onChange({ lat, lng, address }));
  };

  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={markerIcon(color)}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          setFromLatLng(lat, lng);
        },
      }}
    />
  );
}

interface DhakaLocationMapProps {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  onOriginSelect: (point: LocationPoint) => void;
  onDestinationSelect: (point: LocationPoint) => void;
}

export function DhakaLocationMap({
  origin,
  destination,
  onOriginSelect,
  onDestinationSelect,
}: DhakaLocationMapProps) {
  const [picking, setPicking] = React.useState<"origin" | "destination">("origin");

  const handleMapPick = (lat: number, lng: number) => {
    const target = picking === "origin" ? onOriginSelect : onDestinationSelect;
    reverseGeocode(lat, lng).then((address) => target({ lat, lng, address }));
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Tap the map to pick the{" "}
          <span className="font-medium text-foreground">
            {picking === "origin" ? "origin" : "destination"}
          </span>
        </p>
        <div className="flex rounded-lg border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setPicking("origin")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              picking === "origin"
                ? "bg-emerald-500 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Pick Origin
          </button>
          <button
            type="button"
            onClick={() => setPicking("destination")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              picking === "destination"
                ? "bg-rose-500 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Pick Destination
          </button>
        </div>
      </div>

      <MapContainer
        center={DHAKA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: 320, width: "100%", borderRadius: 12, zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickCatcher onPick={handleMapPick} />
        <FlyTo point={origin} />
        <FlyTo point={destination} />
        {origin && (
          <DraggableMarker point={origin} color="#10b981" onChange={onOriginSelect} />
        )}
        {destination && (
          <DraggableMarker point={destination} color="#f43f5e" onChange={onDestinationSelect} />
        )}
      </MapContainer>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-500" /> Origin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-rose-500" /> Destination
        </span>
        {origin && destination && (
          <span className="text-muted-foreground">
            Drag a marker to adjust its position
          </span>
        )}
      </div>
    </div>
  );
}