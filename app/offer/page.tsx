"use client";

import { RequireAuth } from "@/components/auth/require-auth";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/lib/api";
import { distanceInMiles, formatCurrency } from "@/lib/format";
import {
  DESTINATION_COLOR,
  DESTINATION_TARGET,
  formatCoordinates,
  ORIGIN_COLOR,
  ORIGIN_TARGET,
  STOP_COLOR,
  type LocationField,
  type LocationPoint,
  type MapStop,
} from "@/lib/locations";
import type { Ride, RideEstimate, Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, MapPin, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const DhakaLocationMap = dynamic(
  () =>
    import("@/components/maps/dhaka-location-map").then(
      (m) => m.DhakaLocationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-90 w-full animate-pulse rounded-lg bg-muted" />
    ),
  },
);

const steps = [
  "Route Details",
  "Schedule & Recurrence",
  "Preferences",
  "Confirmation",
] as const;

interface StopField {
  id: string;
  address: string;
  point: LocationPoint | null;
}

const emptyField = (): LocationField => ({ address: "", point: null });

interface LocationCardProps {
  glyph: string;
  color: string;
  label: string;
  field: LocationField;
  placeholder: string;
  active: boolean;
  onAddressChange: (address: string) => void;
  onPickOnMap: () => void;
  onRemove?: () => void;
}

function LocationCard({
  glyph,
  color,
  label,
  field,
  placeholder,
  active,
  onAddressChange,
  onPickOnMap,
  onRemove,
}: LocationCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
        active && "border-primary bg-accent/30",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {glyph}
          </span>
          <Label>{label}</Label>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={active ? "default" : "outline"}
            size="xs"
            onClick={onPickOnMap}
          >
            <MapPin />
            {field.point
              ? active
                ? "Picking…"
                : "Edit on map"
              : "Pick on map"}
          </Button>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onRemove}
              aria-label={`Remove ${label}`}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <Input
        placeholder={placeholder}
        value={field.address}
        onChange={(e) => onAddressChange(e.target.value)}
      />
      <p
        className={cn(
          "text-xs",
          field.point ? "text-muted-foreground" : "text-destructive",
        )}
      >
        {field.point
          ? `Coordinates from map: ${formatCoordinates(field.point)}`
          : "Coordinates are read from the map — pick this point to set them."}
      </p>
    </div>
  );
}

export default function OfferRidePage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  const [origin, setOrigin] = React.useState<LocationField>(emptyField());
  const [destination, setDestination] =
    React.useState<LocationField>(emptyField());
  const [stops, setStops] = React.useState<StopField[]>([]);
  const [activeTarget, setActiveTarget] = React.useState<string>(ORIGIN_TARGET);
  const mapRef = React.useRef<HTMLDivElement>(null);

  const [departureDate, setDepartureDate] = React.useState("");
  const [departureTime, setDepartureTime] = React.useState("");
  const [recurrence, setRecurrence] = React.useState("one-time");

  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = React.useState("");
  const [totalSeats, setTotalSeats] = React.useState(3);
  const [pricePerSeat, setPricePerSeat] = React.useState("1.00");
  const [isFemaleOnly, setIsFemaleOnly] = React.useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = React.useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = React.useState(true);
  const [isSavingVehicle, setIsSavingVehicle] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isEstimating, setIsEstimating] = React.useState(false);
  const [estimate, setEstimate] = React.useState<RideEstimate | null>(null);
  const estimateAbortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    api
      .get<Vehicle[]>("/vehicle")
      .then((v) => {
        setVehicles(v);
        if (v.length > 0) setVehicleId(v[0].id);
      })
      .catch(() => {})
      .finally(() => setIsLoadingVehicles(false));
  }, []);

  const routePoints = React.useMemo(
    () =>
      [origin.point, ...stops.map((s) => s.point), destination.point].filter(
        (point): point is LocationPoint => point !== null,
      ),
    [origin.point, stops, destination.point],
  );

  const distance = React.useMemo(
    () =>
      routePoints.reduce(
        (total, point, i) =>
          i === 0
            ? total
            : total +
              distanceInMiles(
                routePoints[i - 1].lat,
                routePoints[i - 1].lng,
                point.lat,
                point.lng,
              ),
        0,
      ),
    [routePoints],
  );

  const hasCoords =
    routePoints.length === stops.length + 2 && routePoints.length >= 2;
  const baseFuelCost = distance * 0.17;
  const parkingSplit = 1.5;
  const maintenanceBuffer = distance * 0.05;
  const suggestedContribution = baseFuelCost + parkingSplit + maintenanceBuffer;

  // Estimate price per seat based on historical average price/mile (with env
  // fallback). Debounced and re-run whenever the route changes.
  React.useEffect(() => {
    if (!hasCoords) {
      return;
    }

    // Debounce: avoid hammering the API while the user is dragging markers.
    const timeoutId = setTimeout(async () => {
      estimateAbortRef.current?.abort();
      const controller = new AbortController();
      estimateAbortRef.current = controller;

      setIsEstimating(true);
      try {
        const points = routePoints.map((p) => ({ lat: p.lat, lng: p.lng }));
        const originP = points[0];
        const destP = points[points.length - 1];
        const stopsP = points.slice(1, -1);

        const est = await api.post<RideEstimate>("/ride/estimate", {
          originLat: originP.lat,
          originLng: originP.lng,
          destinationLat: destP.lat,
          destinationLng: destP.lng,
          ...(stopsP.length > 0 ? { stops: stopsP } : {}),
        });

        if (!controller.signal.aborted) {
          setEstimate(est);
          const suggested = est.suggestedPricePerSeat;
          if (suggested >= 0) {
            setPricePerSeat(suggested.toFixed(2));
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.warn("Failed to estimate ride price", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsEstimating(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      estimateAbortRef.current?.abort();
    };
  }, [hasCoords, routePoints]);

  const canContinueStep0 =
    origin.address.trim() &&
    origin.point &&
    destination.address.trim() &&
    destination.point &&
    stops.every((s) => s.address.trim() && s.point);
  const canContinueStep1 = departureDate && departureTime;
  const canContinueStep2 =
    vehicleId && totalSeats > 0 && Number(pricePerSeat) > 0;

  const focusOnMap = React.useCallback((target: string) => {
    setActiveTarget(target);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const nextStopId = React.useRef(0);
  const addStop = () => {
    nextStopId.current += 1;
    const id = `stop-${nextStopId.current}`;
    setStops((s) => [...s, { id, address: "", point: null }]);
    focusOnMap(id);
  };
  const removeStop = (id: string) => {
    setStops((s) => s.filter((stop) => stop.id !== id));
    setActiveTarget((current) => (current === id ? ORIGIN_TARGET : current));
  };
  const updateStopAddress = (id: string, address: string) =>
    setStops((s) =>
      s.map((stop) => (stop.id === id ? { ...stop, address } : stop)),
    );

  const handleOriginSelect = (point: LocationPoint) =>
    setOrigin({ address: point.address, point });
  const handleDestinationSelect = (point: LocationPoint) =>
    setDestination({ address: point.address, point });
  const handleStopSelect = (id: string, point: LocationPoint) =>
    setStops((s) =>
      s.map((stop) =>
        stop.id === id ? { ...stop, address: point.address, point } : stop,
      ),
    );

  const handleAddVehicle = async (form: FormData) => {
    setIsSavingVehicle(true);
    try {
      const vehicle = await api.post<Vehicle>("/vehicle/create", {
        model: form.get("model"),
        color: form.get("color"),
        plate: form.get("plate"),
        seat_capacity: Number(form.get("seat_capacity")),
      });
      setVehicles((v) => [...v, vehicle]);
      setVehicleId(vehicle.id);
      setAddVehicleOpen(false);
      toast.success("Vehicle added");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to add vehicle",
      );
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleSubmit = async () => {
    if (!origin.point || !destination.point || stops.some((s) => !s.point)) {
      toast.error("Every stop needs a location picked on the map");
      setStep(0);
      return;
    }

    setIsSubmitting(true);
    try {
      const departureTimeIso = new Date(
        `${departureDate}T${departureTime}`,
      ).toISOString();

      const checkpoints = [
        {
          type: "PICKUP" as const,
          address: origin.address.trim(),
          lat: origin.point.lat,
          lng: origin.point.lng,
        },
        ...stops.map((stop) => ({
          type: "STOP" as const,
          address: stop.address.trim(),
          lat: stop.point!.lat,
          lng: stop.point!.lng,
        })),
        {
          type: "DROP" as const,
          address: destination.address.trim(),
          lat: destination.point.lat,
          lng: destination.point.lng,
        },
      ];

      // The ride and every checkpoint are created in one backend transaction, so
      // a rejected route can never leave a half-posted ride behind.
      const ride = await api.post<Ride>("/ride/create", {
        vehicleId,
        originAddress: origin.address.trim(),
        originLat: origin.point.lat,
        originLng: origin.point.lng,
        destinationAddress: destination.address.trim(),
        destinationLat: destination.point.lat,
        destinationLng: destination.point.lng,
        departureTime: departureTimeIso,
        totalSeats,
        pricePerSeat: Number(pricePerSeat),
        isFemaleOnly,
        checkpoints,
      });

      toast.success("Ride posted successfully");
      router.push(`/find/${ride.id}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to post ride",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapStops: MapStop[] = stops.map(({ id, point }) => ({ id, point }));

  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr_260px]">
            <aside className="flex flex-row gap-2 lg:flex-col">
              {steps.map((label, i) => (
                <div
                  key={label}
                  className="flex items-center gap-2 lg:items-start"
                >
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                      i < step
                        ? "bg-primary text-primary-foreground"
                        : i === step
                          ? "border-2 border-primary text-primary"
                          : "border text-muted-foreground"
                    }`}
                  >
                    {i < step ? <Check className="size-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`hidden text-sm lg:inline ${i === step ? "font-medium text-foreground" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </aside>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>{steps[step]}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {step === 0 && (
                  <>
                    <div ref={mapRef} className="rounded-lg border p-3">
                      <DhakaLocationMap
                        origin={origin.point}
                        destination={destination.point}
                        stops={mapStops}
                        activeTarget={activeTarget}
                        onActiveTargetChange={setActiveTarget}
                        onOriginSelect={handleOriginSelect}
                        onDestinationSelect={handleDestinationSelect}
                        onStopSelect={handleStopSelect}
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <LocationCard
                        glyph="A"
                        color={ORIGIN_COLOR}
                        label="Origin (Pickup)"
                        field={origin}
                        placeholder="Campus Main Gate / Apartment Complex"
                        active={activeTarget === ORIGIN_TARGET}
                        onAddressChange={(address) =>
                          setOrigin((current) => ({ ...current, address }))
                        }
                        onPickOnMap={() => focusOnMap(ORIGIN_TARGET)}
                      />

                      {stops.map((stop, i) => (
                        <LocationCard
                          key={stop.id}
                          glyph={String(i + 1)}
                          color={STOP_COLOR}
                          label={`Intermediate Pickup ${i + 1}`}
                          field={stop}
                          placeholder="Science Park / Library Square"
                          active={activeTarget === stop.id}
                          onAddressChange={(address) =>
                            updateStopAddress(stop.id, address)
                          }
                          onPickOnMap={() => focusOnMap(stop.id)}
                          onRemove={() => removeStop(stop.id)}
                        />
                      ))}

                      <button
                        type="button"
                        onClick={addStop}
                        className="flex items-center gap-1.5 self-start text-sm font-medium text-primary hover:underline"
                      >
                        <Plus className="size-4" /> Add another stop
                      </button>

                      <LocationCard
                        glyph="B"
                        color={DESTINATION_COLOR}
                        label="Final Destination (Drop-off)"
                        field={destination}
                        placeholder="Enter drop-off location"
                        active={activeTarget === DESTINATION_TARGET}
                        onAddressChange={(address) =>
                          setDestination((current) => ({ ...current, address }))
                        }
                        onPickOnMap={() => focusOnMap(DESTINATION_TARGET)}
                      />
                    </div>

                    {!canContinueStep0 && (
                      <p className="text-xs text-muted-foreground">
                        Every point needs an address and a location picked on
                        the map before continuing.
                      </p>
                    )}
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>Departure Date</Label>
                        <Input
                          type="date"
                          value={departureDate}
                          onChange={(e) => setDepartureDate(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Departure Time</Label>
                        <Input
                          type="time"
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Recurrence</Label>
                      <Select value={recurrence} onValueChange={setRecurrence}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-time">
                            One-time Trip
                          </SelectItem>
                          <SelectItem value="weekdays">Weekdays</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Recurring trips are not yet persisted — this ride will
                        be posted as a one-time trip for now.
                      </p>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label>Vehicle</Label>
                        <Dialog
                          open={addVehicleOpen}
                          onOpenChange={setAddVehicleOpen}
                        >
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => setAddVehicleOpen(true)}
                          >
                            + Add vehicle
                          </Button>
                          <DialogContent>
                            <form
                              action={(formData) => handleAddVehicle(formData)}
                              className="flex flex-col gap-4"
                            >
                              <DialogHeader>
                                <DialogTitle>Add a vehicle</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                  <Label>Model</Label>
                                  <Input
                                    name="model"
                                    required
                                    placeholder="Tesla Model 3"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <Label>Color</Label>
                                  <Input
                                    name="color"
                                    required
                                    placeholder="White"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <Label>Plate</Label>
                                  <Input
                                    name="plate"
                                    required
                                    placeholder="ECC-2024"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <Label>Seats</Label>
                                  <Input
                                    name="seat_capacity"
                                    type="number"
                                    min={1}
                                    required
                                    defaultValue={4}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  type="submit"
                                  disabled={isSavingVehicle}
                                >
                                  {isSavingVehicle ? (
                                    <>
                                      <Spinner /> Saving…
                                    </>
                                  ) : (
                                    "Save vehicle"
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Select value={vehicleId} onValueChange={setVehicleId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.color} {v.model} · {v.plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isLoadingVehicles ? (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Spinner /> Loading your vehicles…
                        </p>
                      ) : (
                        vehicles.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            You don&apos;t have any vehicles yet — add one to
                            continue.
                          </p>
                        )
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>Total Seats</Label>
                        <Input
                          type="number"
                          min={1}
                          value={totalSeats}
                          onChange={(e) =>
                            setTotalSeats(Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Price per Seat ($)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={pricePerSeat}
                          onChange={(e) => setPricePerSeat(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {isEstimating && hasCoords ? (
                            "Calculating suggested price from recent rides…"
                          ) : estimate && hasCoords ? (
                            <>
                              Suggested:{" "}
                              {formatCurrency(estimate.suggestedPricePerSeat)}
                              {" · "}
                              {estimate.rateSource === "RIDE_AVERAGE"
                                ? `avg ${formatCurrency(estimate.ratePerMile)}/mi`
                                : `default ${formatCurrency(estimate.ratePerMile)}/mi`}
                              {estimate.sampleRideCount > 0
                                ? ` from ${estimate.sampleRideCount} ride${estimate.sampleRideCount === 1 ? "" : "s"}`
                                : " (no rides yet)"}
                              {distance > 0 && ` · ${distance.toFixed(1)} mi`}
                            </>
                          ) : hasCoords ? (
                            "Enter a price or wait for a suggested one."
                          ) : (
                            "Pick origin and destination on the map to see a suggested price."
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label>Female-Only Ride</Label>
                        <p className="text-xs text-muted-foreground">
                          Visible only to verified female community members.
                        </p>
                      </div>
                      <Switch
                        checked={isFemaleOnly}
                        onCheckedChange={setIsFemaleOnly}
                      />
                    </div>
                  </>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route</span>
                      <span className="text-right font-medium">
                        {origin.address} → {destination.address}
                        {stops.length > 0 &&
                          ` (+${stops.length} stop${stops.length > 1 ? "s" : ""})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Departure</span>
                      <span className="font-medium">
                        {departureDate} at {departureTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle</span>
                      <span className="font-medium">
                        {vehicles.find((v) => v.id === vehicleId)?.model ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Seats / Price
                      </span>
                      <span className="font-medium">
                        {totalSeats} seats · {formatCurrency(pricePerSeat)}/seat
                      </span>
                    </div>
                    {isFemaleOnly && (
                      <Badge variant="secondary" className="w-fit">
                        Female-Only
                      </Badge>
                    )}
                    <Separator />
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner /> Posting ride…
                        </>
                      ) : (
                        "Post Ride"
                      )}
                    </Button>
                  </div>
                )}

                {step < 3 && (
                  <div className="mt-2 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      disabled={step === 0}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep((s) => Math.min(3, s + 1))}
                      disabled={
                        (step === 0 && !canContinueStep0) ||
                        (step === 1 && !canContinueStep1) ||
                        (step === 2 && !canContinueStep2)
                      }
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <aside className="flex flex-col gap-4">
              <Card className="border-primary/20 bg-accent/20">
                <CardHeader>
                  <CardTitle className="text-sm">Cost Calculator</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Base fuel cost (approx.)
                    </span>
                    <span>
                      {hasCoords ? formatCurrency(baseFuelCost) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Campus parking split
                    </span>
                    <span>{formatCurrency(parkingSplit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Maintenance buffer
                    </span>
                    <span>
                      {hasCoords ? formatCurrency(maintenanceBuffer) : "—"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Suggested contribution</span>
                    <span className="text-primary">
                      {hasCoords ? formatCurrency(suggestedContribution) : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on current gas prices and{" "}
                    {routePoints.length > 1 ? `${distance.toFixed(1)} mi` : "—"}{" "}
                    total route across {routePoints.length} mapped{" "}
                    {routePoints.length === 1 ? "point" : "points"}.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Route Stops</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="flex flex-col gap-2 text-xs">
                    <li className="flex items-start gap-2">
                      <span
                        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: ORIGIN_COLOR }}
                      >
                        A
                      </span>
                      <span
                        className={cn(!origin.point && "text-muted-foreground")}
                      >
                        {origin.address || "Origin not set"}
                      </span>
                    </li>
                    {stops.map((stop, i) => (
                      <li key={stop.id} className="flex items-start gap-2">
                        <span
                          className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: STOP_COLOR }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className={cn(!stop.point && "text-muted-foreground")}
                        >
                          {stop.address || `Stop ${i + 1} not set`}
                        </span>
                      </li>
                    ))}
                    <li className="flex items-start gap-2">
                      <span
                        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: DESTINATION_COLOR }}
                      >
                        B
                      </span>
                      <span
                        className={cn(
                          !destination.point && "text-muted-foreground",
                        )}
                      >
                        {destination.address || "Destination not set"}
                      </span>
                    </li>
                  </ol>
                  {routePoints.length > 1 && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {distance.toFixed(1)} mi total route
                    </p>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
