"use client";

import { RequireAuth } from "@/components/auth/require-auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDateTime, initials } from "@/lib/format";
import type { Booking, Ride } from "@/lib/types";
import {
  CalendarClock,
  Car,
  CheckCircle2,
  MapPin,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

function DashboardContent() {
  const { user } = useAuth();
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [pendingBookings, setPendingBookings] = React.useState<Booking[]>([]);
  const [requestsLoading, setRequestsLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isUpdatingRideId, setIsUpdatingRideId] = React.useState<string | null>(
    null,
  );

  const loadRides = React.useCallback(() => {
    // "/ride/my" rather than "/ride": the public list hides fully booked rides,
    // which would also hide this driver's own ride once every seat is taken.
    api
      .get<Ride[]>("/ride/my")
      .then(setRides)
      .catch((err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Failed to load rides",
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    loadRides();
  }, [loadRides]);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const myActiveRides = rides.filter(
        (r) =>
          r.driverId === user.id &&
          (r.status === "SCHEDULED" || r.status === "ONGOING"),
      );
      const settled = await Promise.allSettled(
        myActiveRides.map((r) => api.get<Booking[]>(`/booking/ride/${r.id}`)),
      );
      if (cancelled) return;
      setPendingBookings(
        settled
          .flatMap((res) => (res.status === "fulfilled" ? res.value : []))
          .filter((b) => b.status === "PENDING" || b.status === "CONFIRMED")
          .sort(
            (a, b) => +new Date(b.bookingTime) - +new Date(a.bookingTime),
          ),
      );
      setRequestsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [rides, user, refreshKey]);

  if (!user) return null;

  const activeRides = rides.filter(
    (r) =>
      r.driverId === user.id &&
      (r.status === "SCHEDULED" || r.status === "ONGOING"),
  );

  const handleStatusChange = async (
    rideId: string,
    status: "ONGOING" | "COMPLETED",
  ) => {
    setIsUpdatingRideId(rideId);
    try {
      await api.patch(`/ride/${rideId}`, { status });
      toast.success(
        status === "COMPLETED"
          ? "Ride marked as finished"
          : "Ride started — passengers can now track it",
      );
      loadRides();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update ride",
      );
    } finally {
      setIsUpdatingRideId(null);
    }
  };

  const handleStartRide = (rideId: string) =>
    handleStatusChange(rideId, "ONGOING");

  const handleFinish = (rideId: string) =>
    handleStatusChange(rideId, "COMPLETED");

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      await api.patch(`/booking/${bookingId}/cancel`, {});
      toast.success("Booking declined · seats released");
      loadRides();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to decline booking",
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Overview
            </p>
            <h1 className="text-2xl font-semibold">Driver Dashboard</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <Car className="size-4" /> Active Rides
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {isLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : activeRides.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Car />
                      </EmptyMedia>
                      <EmptyTitle>No active rides</EmptyTitle>
                      <EmptyDescription>
                        Post a ride to start driving for your campus.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button asChild size="sm">
                        <Link href="/offer">Offer a Ride</Link>
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  activeRides.map((ride) => (
                    <div
                      key={ride.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              ride.status === "ONGOING" ? "eco" : "secondary"
                            }
                          >
                            {ride.status === "ONGOING"
                              ? "In Progress"
                              : "Scheduled"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Departure: {formatDateTime(ride.departureTime)}
                          </span>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                          <MapPin className="size-3.5 text-primary" />
                          {ride.originAddress} → {ride.destinationAddress}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/find/${ride.id}`}>View Map</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/chats?ride=${ride.id}`}>
                            <MessageSquare className="mr-1.5 size-3.5" />
                            Chat
                          </Link>
                        </Button>
                        <span className="self-center text-xs text-muted-foreground">
                          {ride.availableSeats}/{ride.totalSeats} seats left
                        </span>
                        <Button
                          size="sm"
                          onClick={() =>
                            ride.status === "SCHEDULED"
                              ? void handleStartRide(ride.id)
                              : void handleFinish(ride.id)
                          }
                          disabled={isUpdatingRideId === ride.id}
                        >
                          {isUpdatingRideId === ride.id
                            ? "Updating..."
                            : ride.status === "SCHEDULED"
                              ? "Start Ride"
                              : "Finished"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <CheckCircle2 className="size-4" /> Passenger Requests
                </CardTitle>
                {pendingBookings.length > 0 && (
                  <Badge variant="outline">{pendingBookings.length}</Badge>
                )}
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : pendingBookings.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No passenger requests right now.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {pendingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex flex-col gap-3 rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage
                              src={booking.passenger?.image ?? undefined}
                              alt={booking.passenger?.name}
                            />
                            <AvatarFallback>
                              {initials(booking.passenger?.name ?? "R")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 text-sm">
                            <p className="truncate font-medium">
                              {booking.passenger?.name ?? "Rider"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.seatsBooked} seat
                              {booking.seatsBooked === 1 ? "" : "s"} ·{" "}
                              {formatCurrency(booking.costShareAmount)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              booking.status === "CONFIRMED" ? "eco" : "secondary"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          Pickup: {booking.pickupCheckpoint?.address ?? "—"}
                        </p>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeclineBooking(booking.id)}
                        >
                          Decline & Release Seats
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <CalendarClock className="size-4" /> Recurring Rides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Recurring schedules aren&apos;t supported on the backend yet —
                  this is where repeats of your regular trips would appear.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Campus Traffic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-xs text-muted-foreground">
                  <MapPin className="mr-1.5 size-4" /> Traffic map coming soon
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
