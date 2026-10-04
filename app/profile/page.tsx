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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDateTime, initials } from "@/lib/format";
import type { Booking, Ride } from "@/lib/types";
import { CalendarClock, Heart, LogOut, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

function ProfileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<Ride[]>("/ride")
      .then(setRides)
      .catch((err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Failed to load rides",
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const loadBookings = React.useCallback(() => {
    api
      .get<Booking[]>("/booking/my-bookings")
      .then(setBookings)
      .catch((err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Failed to load bookings",
        ),
      )
      .finally(() => setBookingsLoading(false));
  }, []);

  React.useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  if (!user) return null;

  const postedRides = rides.filter((r) => r.driverId === user.id);

  const handleCancelRide = async (rideId: string) => {
    try {
      await api.delete(`/ride/${rideId}`);
      setRides((prev) => prev.filter((r) => r.id !== rideId));
      toast.success("Ride cancelled");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to cancel ride",
      );
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.patch(`/booking/${bookingId}/cancel`, {});
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CANCELLED" } : b,
        ),
      );
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to cancel booking",
      );
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <Avatar size="lg" className="size-16">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.isVerified
                      ? "Verified community member"
                      : "Community member"}
                  </p>
                </div>
                <div className="grid w-full grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-lg font-semibold text-primary">
                      {user.avgRatingAsDriver.toFixed(1)}★
                    </p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-lg font-semibold">
                      {user.cancellationCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cancellations
                    </p>
                  </div>
                </div>
                {/* <p className="text-xs text-muted-foreground">
                  Profile edits aren&apos;t available yet — the backend has no
                  endpoint for updating your account details.
                </p> */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Heart className="size-4" /> Favorite Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* <p className="py-3 text-center text-sm text-muted-foreground">
                  Saving favorite drivers isn&apos;t supported on the backend
                  yet — your saved drivers will appear here once it is.
                </p> */}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Tabs defaultValue="posted">
              <TabsList>
                <TabsTrigger value="posted">Posted Rides</TabsTrigger>
                <TabsTrigger value="booked">Booked Rides</TabsTrigger>
              </TabsList>
              <TabsContent value="posted" className="mt-4 flex flex-col gap-3">
                {isLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : postedRides.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MapPin />
                      </EmptyMedia>
                      <EmptyTitle>No posted rides yet</EmptyTitle>
                      <EmptyDescription>
                        Offer your first ride to the campus community.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button asChild size="sm">
                        <Link href="/offer">Offer a Ride</Link>
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  postedRides.map((ride) => (
                    <Card key={ride.id}>
                      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-medium">
                            <MapPin className="size-3.5 text-primary" />
                            {ride.originAddress} → {ride.destinationAddress}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" />
                            {formatDateTime(ride.departureTime)} ·{" "}
                            {formatCurrency(ride.pricePerSeat)}
                            /seat
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              ride.status === "SCHEDULED" ? "eco" : "secondary"
                            }
                          >
                            {ride.status}
                          </Badge>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/find/${ride.id}`}>Manage</Link>
                          </Button>
                          {ride.status === "SCHEDULED" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelRide(ride.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              <TabsContent value="booked" className="mt-4 flex flex-col gap-3">
                {bookingsLoading ? (
                  <Skeleton className="h-20 w-full rounded-xl" />
                ) : bookings.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MapPin />
                      </EmptyMedia>
                      <EmptyTitle>No booked rides yet</EmptyTitle>
                      <EmptyDescription>
                        When you book a seat on a ride, it will appear here.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button asChild size="sm">
                        <Link href="/find">Find a Ride</Link>
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-medium">
                            <MapPin className="size-3.5 text-primary" />
                            {booking.ride?.originAddress ?? "—"} →{" "}
                            {booking.ride?.destinationAddress ?? "—"}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" />
                            {formatDateTime(
                              booking.ride?.departureTime ?? booking.createdAt,
                            )}
                            {" · "}
                            {booking.seatsBooked} seat
                            {booking.seatsBooked === 1 ? "" : "s"} ·{" "}
                            {formatCurrency(booking.costShareAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Driver: {booking.ride?.driver?.name ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              booking.status === "PENDING" ||
                              booking.status === "CONFIRMED"
                                ? "eco"
                                : booking.status === "CANCELLED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {booking.status}
                          </Badge>
                          {(booking.status === "PENDING" ||
                            booking.status === "CONFIRMED") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Signed in as {user.email}
                </p>
                <Button
                  variant="outline"
                  className="w-fit"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" /> Log Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
