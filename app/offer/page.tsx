"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
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
import type { Ride, Vehicle } from "@/lib/types";
import { Check, MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const steps = ["Route Details", "Schedule & Recurrence", "Preferences", "Confirmation"] as const;

interface StopInput {
  address: string;
  lat: string;
  lng: string;
}

const emptyStop = (): StopInput => ({ address: "", lat: "", lng: "" });

export default function OfferRidePage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  const [origin, setOrigin] = React.useState<StopInput>(emptyStop());
  const [destination, setDestination] = React.useState<StopInput>(emptyStop());
  const [stops, setStops] = React.useState<StopInput[]>([]);

  const [departureDate, setDepartureDate] = React.useState("");
  const [departureTime, setDepartureTime] = React.useState("");
  const [recurrence, setRecurrence] = React.useState("one-time");

  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = React.useState("");
  const [totalSeats, setTotalSeats] = React.useState(3);
  const [pricePerSeat, setPricePerSeat] = React.useState("5.00");
  const [isFemaleOnly, setIsFemaleOnly] = React.useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    api
      .get<Vehicle[]>("/vehicle")
      .then((v) => {
        setVehicles(v);
        if (v.length > 0) setVehicleId(v[0].id);
      })
      .catch(() => {});
  }, []);

  const originLat = Number(origin.lat) || 0;
  const originLng = Number(origin.lng) || 0;
  const destLat = Number(destination.lat) || 0;
  const destLng = Number(destination.lng) || 0;
  const hasCoords = origin.lat && origin.lng && destination.lat && destination.lng;
  const distance = hasCoords ? distanceInMiles(originLat, originLng, destLat, destLng) : 0;
  const baseFuelCost = distance * 0.17;
  const parkingSplit = 1.5;
  const maintenanceBuffer = distance * 0.05;
  const suggestedContribution = baseFuelCost + parkingSplit + maintenanceBuffer;

  const canContinueStep0 = origin.address && destination.address;
  const canContinueStep1 = departureDate && departureTime;
  const canContinueStep2 = vehicleId && totalSeats > 0 && Number(pricePerSeat) > 0;

  const addStop = () => setStops((s) => [...s, emptyStop()]);
  const removeStop = (index: number) => setStops((s) => s.filter((_, i) => i !== index));
  const updateStop = (index: number, patch: Partial<StopInput>) =>
    setStops((s) => s.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)));

  const handleAddVehicle = async (form: FormData) => {
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
      toast.error(err instanceof ApiError ? err.message : "Failed to add vehicle");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const departureTimeIso = new Date(`${departureDate}T${departureTime}`).toISOString();

      const ride = await api.post<Ride>("/ride/create", {
        vehicleId,
        originAddress: origin.address,
        originLat,
        originLng,
        destinationAddress: destination.address,
        destinationLat: destLat,
        destinationLng: destLng,
        departureTime: departureTimeIso,
        totalSeats,
        pricePerSeat: Number(pricePerSeat),
        isFemaleOnly,
      });

      const checkpointPayloads = [
        { type: "PICKUP", address: origin.address, lat: originLat, lng: originLng, sequenceOrder: 1 },
        ...stops.map((stop, i) => ({
          type: "STOP",
          address: stop.address,
          lat: Number(stop.lat) || 0,
          lng: Number(stop.lng) || 0,
          sequenceOrder: i + 2,
        })),
        {
          type: "DROP",
          address: destination.address,
          lat: destLat,
          lng: destLng,
          sequenceOrder: stops.length + 2,
        },
      ];

      await Promise.all(
        checkpointPayloads.map((cp) =>
          api.post("/ride-checkpoint/create", { rideId: ride.id, ...cp }),
        ),
      );

      toast.success("Ride posted successfully");
      router.push(`/find/${ride.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to post ride");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr_260px]">
            <aside className="flex flex-row gap-2 lg:flex-col">
              {steps.map((label, i) => (
                <div key={label} className="flex items-center gap-2 lg:items-start">
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
              <Badge variant="eco" className="mt-4 hidden w-fit lg:inline-flex">
                Drivers earn +50 campus credits per green shared trip
              </Badge>
            </aside>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>{steps[step]}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {step === 0 && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label>Origin</Label>
                      <Input
                        placeholder="Campus Main Gate / Apartment Complex"
                        value={origin.address}
                        onChange={(e) => setOrigin({ ...origin, address: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          value={origin.lat}
                          onChange={(e) => setOrigin({ ...origin, lat: e.target.value })}
                        />
                        <Input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          value={origin.lng}
                          onChange={(e) => setOrigin({ ...origin, lng: e.target.value })}
                        />
                      </div>
                    </div>

                    {stops.map((stop, i) => (
                      <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-dashed p-3">
                        <div className="flex items-center justify-between">
                          <Label>Intermediate Pickup {i + 1}</Label>
                          <button
                            type="button"
                            onClick={() => removeStop(i)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <Input
                          placeholder="Science Park / Library Square"
                          value={stop.address}
                          onChange={(e) => updateStop(i, { address: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            step="any"
                            placeholder="Latitude"
                            value={stop.lat}
                            onChange={(e) => updateStop(i, { lat: e.target.value })}
                          />
                          <Input
                            type="number"
                            step="any"
                            placeholder="Longitude"
                            value={stop.lng}
                            onChange={(e) => updateStop(i, { lng: e.target.value })}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addStop}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Plus className="size-4" /> Add another stop
                    </button>

                    <div className="flex flex-col gap-1.5">
                      <Label>Final Destination</Label>
                      <Input
                        placeholder="Enter drop-off location"
                        value={destination.address}
                        onChange={(e) => setDestination({ ...destination, address: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          value={destination.lat}
                          onChange={(e) => setDestination({ ...destination, lat: e.target.value })}
                        />
                        <Input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          value={destination.lng}
                          onChange={(e) => setDestination({ ...destination, lng: e.target.value })}
                        />
                      </div>
                    </div>
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
                          <SelectItem value="one-time">One-time Trip</SelectItem>
                          <SelectItem value="weekdays">Weekdays</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Recurring trips are not yet persisted — this ride will be posted as a
                        one-time trip for now.
                      </p>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label>Vehicle</Label>
                        <Dialog open={addVehicleOpen} onOpenChange={setAddVehicleOpen}>
                          <Button type="button" variant="link" size="sm" onClick={() => setAddVehicleOpen(true)}>
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
                                  <Input name="model" required placeholder="Tesla Model 3" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <Label>Color</Label>
                                  <Input name="color" required placeholder="White" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <Label>Plate</Label>
                                  <Input name="plate" required placeholder="ECC-2024" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <Label>Seats</Label>
                                  <Input name="seat_capacity" type="number" min={1} required defaultValue={4} />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit">Save vehicle</Button>
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
                      {vehicles.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          You don&apos;t have any vehicles yet — add one to continue.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>Total Seats</Label>
                        <Input
                          type="number"
                          min={1}
                          value={totalSeats}
                          onChange={(e) => setTotalSeats(Number(e.target.value))}
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
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label>Female-Only Ride</Label>
                        <p className="text-xs text-muted-foreground">
                          Visible only to verified female community members.
                        </p>
                      </div>
                      <Switch checked={isFemaleOnly} onCheckedChange={setIsFemaleOnly} />
                    </div>
                  </>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route</span>
                      <span className="text-right font-medium">
                        {origin.address} → {destination.address}
                        {stops.length > 0 && ` (+${stops.length} stop${stops.length > 1 ? "s" : ""})`}
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
                      <span className="text-muted-foreground">Seats / Price</span>
                      <span className="font-medium">
                        {totalSeats} seats · {formatCurrency(pricePerSeat)}/seat
                      </span>
                    </div>
                    {isFemaleOnly && <Badge variant="secondary" className="w-fit">Female-Only</Badge>}
                    <Separator />
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                      {isSubmitting ? "Posting ride..." : "Post Ride"}
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
                    <span className="text-muted-foreground">Base fuel cost (approx.)</span>
                    <span>{hasCoords ? formatCurrency(baseFuelCost) : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campus parking split</span>
                    <span>{formatCurrency(parkingSplit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maintenance buffer</span>
                    <span>{hasCoords ? formatCurrency(maintenanceBuffer) : "—"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Suggested contribution</span>
                    <span className="text-primary">
                      {hasCoords ? formatCurrency(suggestedContribution) : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on current gas prices and {hasCoords ? `${distance.toFixed(1)} mi` : "—"} total
                    route.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Route Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-xs text-muted-foreground">
                    <MapPin className="mr-1.5 size-4" />
                    {hasCoords ? `${distance.toFixed(1)} mi route` : "Enter coordinates to preview"}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
        <Footer />
      </div>
    </RequireAuth>
  );
}
