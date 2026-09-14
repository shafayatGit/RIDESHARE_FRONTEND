"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { distanceInMiles, formatCurrency, formatDateTime, initials } from "@/lib/format";
import type { Ride } from "@/lib/types";
import {
  Car,
  Check,
  ChevronLeft,
  CircleDot,
  Cigarette,
  MapPin,
  PawPrint,
  ShieldCheck,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const COST_PER_MILE = 0.65; // illustrative solo-driving cost, used only for the on-page calculator

export default function RideDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ride, setRide] = React.useState<Ride | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [passengers, setPassengers] = React.useState(1);
  const [requested, setRequested] = React.useState(false);

  React.useEffect(() => {
    api
      .get<Ride>(`/ride/${params.id}`)
      .then(setRide)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load ride"))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleBook = () => {
    // The backend has no booking/passenger model yet, so this is a
    // client-side placeholder rather than a persisted request.
    setRequested(true);
    toast.success(`Booking request sent to ${ride?.driver?.name ?? "the driver"}`);
  };

  if (isLoading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-8">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </main>
          <Footer />
        </div>
      </RequireAuth>
    );
  }

  if (!ride) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <p className="text-muted-foreground">This ride couldn&apos;t be found.</p>
            <Link href="/find" className="text-sm text-primary hover:underline">
              Back to Find a Ride
            </Link>
          </main>
          <Footer />
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
  const soloCost = distance * COST_PER_MILE;
  const pricePerSeat = Number(ride.pricePerSeat);
  const estimatedSplit = soloCost / passengers;
  const saving = Math.max(0, soloCost - pricePerSeat);
  const isOwnRide = user?.id === ride.driverId;
  const isFull = ride.availableSeats <= 0;

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
        <Navbar />
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
                    <div>
                      <p className="font-medium">{ride.driver?.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="size-3 fill-current text-amber-500" />
                        {ride.driver?.avgRatingAsDriver.toFixed(1)}
                      </p>
                    </div>
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
                    <span className="font-medium">{ride.availableSeats} seats left</span>
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
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button onClick={handleBook} disabled={requested || isFull} className="w-full">
                        {requested ? (
                          <>
                            <Check /> Request Sent
                          </>
                        ) : isFull ? (
                          "Fully Booked"
                        ) : (
                          "Book Seat"
                        )}
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/chats?ride=${ride.id}`}>Message Driver</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cost-Split Calculator</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Number of Passengers</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <Button
                        key={n}
                        size="sm"
                        variant={passengers === n ? "default" : "outline"}
                        onClick={() => setPassengers(n)}
                        className="flex-1"
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Estimated Split</p>
                    <p className="text-xl font-semibold text-primary">
                      {formatCurrency(estimatedSplit)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estimated saving of {formatCurrency(saving)} vs. solo drive
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </RequireAuth>
  );
}
