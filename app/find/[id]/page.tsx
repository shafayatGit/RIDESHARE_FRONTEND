"use client";

import { RequireAuth } from "@/components/auth/require-auth";

import { DriverReviews } from "@/components/rides/driver-reviews";
import { FavoriteButton } from "@/components/rides/favorite-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { StarRating } from "@/components/ui/star-rating";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { distanceInMiles, formatCurrency, formatDateTime, initials } from "@/lib/format";
import type { Booking, Ride } from "@/lib/types";
import {
  Car,
  ChevronLeft,
  CircleDot,
  Cigarette,
  MapPin,
  PawPrint,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export default function RideDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ride, setRide] = React.useState<Ride | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const [seats, setSeats] = React.useState(1);
  const [pickupCheckpointId, setPickupCheckpointId] = React.useState("");
  const [dropCheckpointId, setDropCheckpointId] = React.useState("");
  const [isBooking, setIsBooking] = React.useState(false);
  const [activeBooking, setActiveBooking] = React.useState<Booking | null>(null);

  const reloadRide = () => {
    api
      .get<Ride>(`/ride/${params.id}`)
      .then(setRide)
      .catch(() => {});
  };

  React.useEffect(() => {
    api
      .get<Ride>(`/ride/${params.id}`)
      .then(setRide)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load ride"))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const isOwnRide = user?.id === ride?.driverId;

  React.useEffect(() => {
    if (!ride || isOwnRide) return;
    let cancelled = false;
    (async () => {
      try {
        const bookings = await api.get<Booking[]>("/booking/my-bookings");
        const active = bookings.find(
          (b) =>
            b.rideId === ride.id &&
            (b.status === "PENDING" || b.status === "CONFIRMED"),
        );
        if (!cancelled) setActiveBooking(active ?? null);
      } catch {
        // booking lookup is best-effort; the main flow surfaces errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ride, isOwnRide]);

  const checkpoints = ride?.checkpoints ?? [];
  const pickupCP = checkpoints.find((cp) => cp.id === pickupCheckpointId) ?? null;
  const dropOptions = pickupCP
    ? checkpoints.filter((cp) => cp.sequenceOrder > pickupCP.sequenceOrder)
    : checkpoints;

  const ensureCheckpointDefaults = () => {
    if (checkpoints.length === 0) return;
    setPickupCheckpointId((prev) => prev || checkpoints[0].id);
    setDropCheckpointId(
      (prev) => prev || checkpoints[checkpoints.length - 1].id,
    );
  };

  const maxSeats = ride ? Math.min(4, ride.availableSeats) : 1;
  const ticketCost = ride ? Number(ride.pricePerSeat) * seats : 0;

  const handleBook = async () => {
    if (!ride) return;
    setIsBooking(true);
    try {
      const created = await api.post<Booking>("/booking/create", {
        rideId: ride.id,
        seatsBooked: seats,
        pickupCheckpointId,
        dropCheckpointId,
      });
      setActiveBooking(created);
      setBookingOpen(false);
      toast.success(`You booked ${seats} seat${seats > 1 ? "s" : ""} on this ride`);
      reloadRide();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to book seat");
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBooking) return;
    try {
      await api.patch(`/booking/${activeBooking.id}/cancel`, {});
      setActiveBooking(null);
      toast.success("Booking cancelled · seats released");
      reloadRide();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel booking");
    }
  };

  if (isLoading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen flex-col">
          <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-8">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </main>
        </div>
      </RequireAuth>
    );
  }

  if (!ride) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen flex-col">
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <p className="text-muted-foreground">This ride couldn&apos;t be found.</p>
            <Link href="/find" className="text-sm text-primary hover:underline">
              Back to Find a Ride
            </Link>
          </main>
        </div>
      </RequireAuth>
    );
  }

  const distance = distanceInMiles(
    ride.originLat,
    ride.originLng,
    ride.destinationLat,
    ride.destinationLng,
  );

  const stops =
    ride.checkpoints && ride.checkpoints.length > 0
      ? ride.checkpoints
      : [
          {
            id: "origin",
            type: "PICKUP" as const,
            address: ride.originAddress,
            estimatedTime: ride.departureTime,
          },
          {
            id: "destination",
            type: "DROP" as const,
            address: ride.destinationAddress,
            estimatedTime: ride.estimatedArrivalTime,
          },
        ];

  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <Link
            href="/find"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> Back to Search
          </Link>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader className="flex-row items-start justify-between">
                  <div>
                    <Badge variant={ride.status === "SCHEDULED" ? "eco" : "secondary"}>
                      {ride.status === "SCHEDULED" ? "Available" : ride.status}
                    </Badge>
                    <CardTitle className="mt-2 text-xl">
                      {ride.originAddress} to {ride.destinationAddress}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Departs {formatDateTime(ride.departureTime)}
                    </p>
                  </div>
                  {ride.isFemaleOnly && <Badge variant="secondary">Female-Only</Badge>}
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4">
                    {stops.map((stop, i) => (
                      <div key={stop.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <CircleDot
                            className={`size-4 ${i === 0 ? "text-primary" : "text-muted-foreground"}`}
                          />
                          {i < stops.length - 1 && <div className="my-1 h-full w-px flex-1 bg-border" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-sm font-medium">{stop.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {stop.type === "PICKUP" ? "Pickup" : stop.type === "DROP" ? "Drop-off" : "Stop"}
                            {stop.estimatedTime ? ` · ${formatDateTime(stop.estimatedTime)}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-sm text-muted-foreground">
                    <MapPin className="mr-2 size-4" /> Map preview · {distance.toFixed(1)} mi estimated
                  </div>
                </CardContent>
              </Card>

              {ride.driver && !isOwnRide && (
                <DriverReviews riderId={ride.driver.id} />
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ride Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Cigarette className="mt-0.5 size-4 text-muted-foreground" />
                    <span>No Smoking — please refrain from smoking or vaping inside the vehicle.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <PawPrint className="mt-0.5 size-4 text-muted-foreground" />
                    <span>Pets Allowed — small pets in carriers are welcome on this ride.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <UtensilsCrossed className="mt-0.5 size-4 text-muted-foreground" />
                    <span>No Food — drinks are okay, but please avoid eating during the trip.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                    <span>Safety First — ID verification required at pickup for all passengers.</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg">
                      <AvatarImage src={ride.driver?.image ?? undefined} alt={ride.driver?.name} />
                      <AvatarFallback>{initials(ride.driver?.name ?? "D")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{ride.driver?.name}</p>
                      <div className="flex items-center gap-1.5">
                        <StarRating
                          value={Math.round(ride.driver?.avgRatingAsDriver ?? 0)}
                          readOnly
                          size="sm"
                        />
                        <span className="text-xs text-muted-foreground">
                          {ride.driver?.avgRatingAsDriver.toFixed(1)}
                          {ride.driver?.ratingCount
                            ? ` (${ride.driver.ratingCount})`
                            : " · no ratings yet"}
                        </span>
                      </div>
                    </div>
                    {ride.driver && !isOwnRide && (
                      <FavoriteButton
                        riderId={ride.driver.id}
                        riderName={ride.driver.name}
                      />
                    )}
                  </div>

                  {ride.vehicle && (
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                      <Car className="size-4 text-muted-foreground" />
                      {ride.vehicle.color} {ride.vehicle.model} · {ride.vehicle.plate}
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Availability</span>
                    <span className="font-medium">
                      {ride.availableSeats} seat{ride.availableSeats === 1 ? "" : "s"} left
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price per seat</span>
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(ride.pricePerSeat)}
                    </span>
                  </div>

                  {isOwnRide ? (
                    <p className="rounded-lg bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
                      This is your posted ride
                    </p>
                  ) : activeBooking ? (
                    <div className="flex flex-col gap-2">
                      <div className="rounded-lg bg-muted px-3 py-2 text-center text-sm">
                        <p className="font-medium">Booking {activeBooking.status.toLowerCase()}</p>
                        <p className="text-muted-foreground">
                          {activeBooking.seatsBooked} seat{activeBooking.seatsBooked === 1 ? "" : "s"} ·{" "}
                          {formatCurrency(activeBooking.costShareAmount)}
                        </p>
                      </div>
                      <Button variant="outline" className="w-full" onClick={handleCancelBooking}>
                        Cancel Request
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/chats?ride=${ride.id}`}>Message Driver</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Dialog
                        open={bookingOpen}
                        onOpenChange={(open) => {
                          if (open) ensureCheckpointDefaults();
                          setBookingOpen(open);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button disabled={ride.availableSeats <= 0} className="w-full">
                            {ride.availableSeats <= 0 ? "Fully Booked" : "Book Seat"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="flex flex-col gap-4">
                          <DialogHeader>
                            <DialogTitle>Book a seat</DialogTitle>
                          </DialogHeader>

                          <div className="flex flex-col gap-1.5">
                            <Label>Number of seats</Label>
                            <Select
                              value={String(seats)}
                              onValueChange={(v) => setSeats(Number(v))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n} {n === 1 ? "seat" : "seats"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <Label>Pickup point</Label>
                            <Select
                              value={pickupCheckpointId}
                              onValueChange={(v) => {
                                setPickupCheckpointId(v);
                                const picked = checkpoints.find((cp) => cp.id === v);
                                if (
                                  picked &&
                                  checkpoints.filter((cp) => cp.sequenceOrder > picked.sequenceOrder)
                                    .length > 0
                                ) {
                                  setDropCheckpointId(
                                    checkpoints.filter(
                                      (cp) => cp.sequenceOrder > picked.sequenceOrder,
                                    )[checkpoints.filter((cp) => cp.sequenceOrder > picked.sequenceOrder).length - 1]
                                      .id,
                                  );
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select pickup" />
                              </SelectTrigger>
                              <SelectContent>
                                {checkpoints.map((cp) => (
                                  <SelectItem key={cp.id} value={cp.id}>
                                    {cp.type === "STOP" ? "Stop" : cp.type === "DROP" ? "Drop-off" : "Pickup"} ·{" "}
                                    {cp.address}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {dropOptions.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                              <Label>Drop-off point</Label>
                              <Select value={dropCheckpointId} onValueChange={setDropCheckpointId}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select drop-off" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dropOptions.map((cp) => (
                                    <SelectItem key={cp.id} value={cp.id}>
                                      {cp.type === "DROP" ? "Drop-off" : "Stop"} · {cp.address}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-semibold text-primary">
                              {formatCurrency(ticketCost)}
                            </span>
                          </div>

                          {ride.isFemaleOnly && (
                            <p className="text-xs text-muted-foreground">
                              This is a female-only ride.
                            </p>
                          )}

                          <DialogFooter>
                            <Button onClick={handleBook} disabled={isBooking}>
                              {isBooking ? (
                                <>
                                  <Spinner /> Booking…
                                </>
                              ) : (
                                "Confirm Booking"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/chats?ride=${ride.id}`}>Message Driver</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}