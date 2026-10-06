"use client";

import { RequireAuth } from "@/components/auth/require-auth";

import { RatingDialog } from "@/components/rides/rating-dialog";
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
import { Spinner } from "@/components/ui/spinner";
import { StarRating } from "@/components/ui/star-rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";
import { formatCurrency, formatDateTime, initials } from "@/lib/format";
import type { Booking, MyRating, Ride, User } from "@/lib/types";
import {
  CalendarClock,
  Heart,
  LogOut,
  MapPin,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

function ProfileContent() {
  const { user, logout } = useAuth();
  const { favorites, isLoading: favoritesLoading, toggleFavorite } =
    useFavorites();
  const router = useRouter();
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = React.useState(true);
  const [myRatings, setMyRatings] = React.useState<MyRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = React.useState(true);
  const [freshUser, setFreshUser] = React.useState<User | null>(null);
  const [ratingRider, setRatingRider] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadRides = React.useCallback(() => {
    // "/ride/my" returns this driver's full history; "/ride" omits fully booked
    // and finished rides, which would hide most of their own record.
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

  const loadMyRatings = React.useCallback(() => {
    api
      .get<MyRating[]>("/rating/my")
      .then(setMyRatings)
      // Ratings are supplementary on this page; don't surface an error toast.
      .catch(() => setMyRatings([]))
      .finally(() => setRatingsLoading(false));
  }, []);

  React.useEffect(() => {
    loadMyRatings();
  }, [loadMyRatings]);

  // The session copy of `user` is written at login and never refreshed, so the
  // header rating would be stale. Pull a fresh copy on mount.
  React.useEffect(() => {
    api
      .get<User>("/auth/me")
      .then(setFreshUser)
      // The header already has session data to fall back on.
      .catch(() => {});
  }, []);

  if (!user) return null;

  const postedRides = rides;
  const profile = freshUser ?? user;

  // Riders this passenger actually rode with: a non-cancelled booking on a
  // completed ride. Matches the backend's rule for who may leave a rating.
  const riddenRiderIds = new Set(
    bookings
      .filter(
        (b) => b.status !== "CANCELLED" && b.ride?.status === "COMPLETED",
      )
      .map((b) => b.ride?.driver?.id)
      .filter((id): id is string => Boolean(id)),
  );

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
                  <AvatarImage src={profile.image ?? undefined} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {initials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.isVerified
                      ? "Verified community member"
                      : "Community member"}
                  </p>
                </div>
                <div className="grid w-full grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-lg font-semibold text-primary">
                      {profile.ratingCount > 0
                        ? `${profile.avgRatingAsDriver.toFixed(1)}★`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile.ratingCount > 0
                        ? `${profile.ratingCount} rating${profile.ratingCount === 1 ? "" : "s"}`
                        : "No ratings yet"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-lg font-semibold">
                      {profile.cancellationCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cancellations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Heart className="size-4" /> Favorite Drivers
                  {favorites.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {favorites.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoritesLoading ? (
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : favorites.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">
                    Tap the heart next to a driver on any ride to save them here.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {favorites.map((favorite) => (
                      <li
                        key={favorite.id}
                        className="flex items-center gap-3"
                      >
                        <Avatar>
                          <AvatarImage
                            src={favorite.rider.image ?? undefined}
                            alt={favorite.rider.name}
                          />
                          <AvatarFallback>
                            {initials(favorite.rider.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {favorite.rider.name}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            {favorite.rider.ratingCount > 0 ? (
                              <>
                                <Star className="size-3 fill-current text-amber-500" />
                                {favorite.rider.avgRatingAsDriver.toFixed(1)}
                                <span className="text-muted-foreground/70">
                                  ({favorite.rider.ratingCount})
                                </span>
                              </>
                            ) : (
                              "No ratings yet"
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${favorite.rider.name} from favorites`}
                          title={`Remove ${favorite.rider.name} from favorites`}
                          onClick={() => void toggleFavorite(favorite.rider.id)}
                        >
                          <X />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Tabs defaultValue="posted">
              <TabsList>
                <TabsTrigger value="posted">Posted Rides</TabsTrigger>
                <TabsTrigger value="booked">Booked Rides</TabsTrigger>
              </TabsList>
              {ratingsLoading && (
                <p className="flex items-center gap-2 pt-3 text-xs text-muted-foreground">
                  <Spinner /> Loading your ratings…
                </p>
              )}
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
                        <div className="min-w-0">
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
                          <p className="text-xs text-muted-foreground">
                            {ride.totalSeats - ride.availableSeats}/
                            {ride.totalSeats} seats booked
                            {ride.status === "COMPLETED" &&
                              " · ride finished"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              ride.status === "SCHEDULED" ||
                              ride.status === "ONGOING"
                                ? "eco"
                                : ride.status === "CANCELLED"
                                  ? "destructive"
                                  : "secondary"
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
                  bookings.map((booking) => {
                    const isCompleted =
                      booking.ride?.status === "COMPLETED";
                    const driver = booking.ride?.driver;
                    const driverName = driver?.name ?? "driver";
                    // Ratings belong to the rider, so they are looked up by
                    // riderId rather than per booking.
                    const myRating = driver
                      ? myRatings.find((r) => r.riderId === driver.id)
                      : undefined;
                    // One rating per rider: offer "Rate" only for a rider the
                    // passenger actually rode with and hasn't rated yet.
                    // The rider's overall rating: prefer the fresh value from
                    // /rating/my (updated right after you submit), else the
                    // aggregate the booking payload already carries.
                    const riderAgg =
                      myRatings.find((r) => r.riderId === driver?.id)?.rider ??
                      (driver
                        ? {
                            avgRatingAsDriver: driver.avgRatingAsDriver,
                            ratingCount: driver.ratingCount,
                          }
                        : undefined);
                    const canRate =
                      isCompleted &&
                      Boolean(driver) &&
                      riddenRiderIds.has(driver!.id) &&
                      !myRatings.some((r) => r.riderId === driver?.id);

                    return (
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
                              Driver: {driverName}
                            </p>
                            {riderAgg && riderAgg.ratingCount > 0 && (
                              <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                <Star className="size-3 fill-current text-amber-500" />
                                {riderAgg.avgRatingAsDriver.toFixed(1)}
                                <span className="text-muted-foreground/70">
                                  ({riderAgg.ratingCount}{" "}
                                  {riderAgg.ratingCount === 1
                                    ? "rating"
                                    : "ratings"}
                                  )
                                </span>
                              </p>
                            )}
                            {myRating && (
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <StarRating
                                  value={myRating.rating}
                                  readOnly
                                  size="sm"
                                />
                                <span className="text-xs text-muted-foreground">
                                  You rated {driverName}
                                  {myRating.review ? ` · "${myRating.review}"` : ""}
                                </span>
                              </div>
                            )}
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
                            {canRate && driver && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setRatingRider({
                                    id: driver.id,
                                    name: driverName,
                                  })
                                }
                              >
                                <Star className="size-3.5" /> Rate {driverName}
                              </Button>
                            )}
                            {myRating && driver && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setRatingRider({
                                    id: driver.id,
                                    name: driverName,
                                  })
                                }
                              >
                                <Star className="size-3.5" /> Edit Rating
                              </Button>
                            )}
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
                    );
                  })
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

        <RatingDialog
          riderId={ratingRider?.id ?? null}
          riderName={ratingRider?.name ?? "this rider"}
          currentRating={
            ratingRider
              ? myRatings.find((r) => r.riderId === ratingRider.id)?.rating
              : null
          }
          currentReview={
            ratingRider
              ? (myRatings.find((r) => r.riderId === ratingRider.id)?.review ??
                null)
              : null
          }
          open={ratingRider !== null}
          onOpenChange={(open) => {
            if (!open) setRatingRider(null);
          }}
          onRated={() => {
            loadMyRatings();
            // The rider's own aggregate score changed, so refresh their profile
            // header if this is their own rider record.
            loadRides();
          }}
        />
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
