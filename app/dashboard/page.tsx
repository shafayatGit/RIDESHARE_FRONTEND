"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime, initials } from "@/lib/format";
import type { Ride } from "@/lib/types";
import { Car, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

interface PendingRequest {
  id: string;
  riderName: string;
  rating: number;
  cancellations: number;
  ecoScore: string;
}

const initialPendingRequests: PendingRequest[] = [
  { id: "req-1", riderName: "Alex Rivera", rating: 4.9, cancellations: 0, ecoScore: "94% Eco" },
  { id: "req-2", riderName: "Maya Chen", rating: 4.7, cancellations: 1, ecoScore: "82% Eco" },
];

const recurringRides = [
  { id: "rec-1", label: "Morning Commute", time: "07:45 AM", tag: "3 Passengers" },
  { id: "rec-2", label: "Evening Lab Return", time: "06:00 PM", tag: "1 Passenger" },
];

function DashboardContent() {
  const { user } = useAuth();
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [pendingRequests, setPendingRequests] = React.useState(initialPendingRequests);

  const loadRides = React.useCallback(() => {
    api
      .get<Ride[]>("/ride")
      .then(setRides)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load rides"))
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    loadRides();
  }, [loadRides]);

  if (!user) return null;

  const activeRides = rides.filter(
    (r) => r.driverId === user.id && (r.status === "SCHEDULED" || r.status === "ONGOING"),
  );

  const handleFinish = async (rideId: string) => {
    try {
      await api.patch(`/ride/${rideId}`, { status: "COMPLETED" });
      toast.success("Ride marked as finished");
      loadRides();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update ride");
    }
  };

  const respondToRequest = (id: string, accepted: boolean) => {
    // No booking/request backend model exists yet, so this only clears the
    // request from the local demo list.
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success(accepted ? "Request accepted" : "Request declined");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Overview</p>
            <h1 className="text-2xl font-semibold">Driver Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <div className="rounded-lg bg-accent/30 px-3 py-1.5 text-right text-xs">
              <p className="text-muted-foreground">CO2 Saved</p>
              <p className="font-semibold text-primary">142kg</p>
            </div>
            <div className="rounded-lg bg-accent/30 px-3 py-1.5 text-right text-xs">
              <p className="text-muted-foreground">Fuel Saved</p>
              <p className="font-semibold text-primary">$84.20</p>
            </div>
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
                      <EmptyDescription>Post a ride to start driving for your campus.</EmptyDescription>
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
                          <Badge variant={ride.status === "ONGOING" ? "eco" : "secondary"}>
                            {ride.status === "ONGOING" ? "In Progress" : "Scheduled"}
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
                        <Button size="sm" onClick={() => handleFinish(ride.id)}>
                          Finished
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No pending requests right now.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="flex flex-col gap-3 rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarFallback>{initials(request.riderName)}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <p className="font-medium">{request.riderName}</p>
                            <p className="text-xs text-muted-foreground">
                              {request.rating}★ rated · {request.ecoScore}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Cancellations: {request.cancellations}</span>
                          <span>{request.ecoScore}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => respondToRequest(request.id, true)}>
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => respondToRequest(request.id, false)}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Recurring</CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toast.info("Recurring rides aren't wired to the backend yet")}
                >
                  <Plus className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {recurringRides.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                    <div>
                      <p className="font-medium">{rec.label}</p>
                      <p className="text-xs text-muted-foreground">{rec.tag}</p>
                    </div>
                    <Badge variant="outline">{rec.time}</Badge>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast.info("Recurring rides aren't wired to the backend yet")}
                >
                  <Plus /> Add Recurring
                </Button>
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
      <Footer />
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
