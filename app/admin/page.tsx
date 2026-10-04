"use client";

import { RequireAuth } from "@/components/auth/require-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import type { Ride } from "@/lib/types";
import { MapPin, RefreshCw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

function AdminContent() {
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchRides = React.useCallback(() => {
    return api
      .get<Ride[]>("/ride")
      .then(setRides)
      .catch((err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Failed to load rides",
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchRides();
  };

  const activeRides = rides.filter(
    (r) => r.status === "SCHEDULED" || r.status === "ONGOING",
  ).length;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              System Overview
            </p>
            <h1 className="text-2xl font-semibold">Campus Operations</h1>
          </div>
          <Button size="sm" onClick={handleRefresh}>
            <RefreshCw /> Live Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">Active Rides</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-8 w-16" />
                ) : (
                  <p className="text-2xl font-semibold">{activeRides}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reported Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Issue reporting isn&apos;t supported on the backend yet —
                  reports from riders and drivers will appear here once it is.
                </p>
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Safety Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-3 text-center text-sm text-muted-foreground">
                  Live safety alerts aren&apos;t available on the backend yet.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Heatmap</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Visualizing ride activity across campus.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-xs text-muted-foreground">
                  <MapPin className="mr-1.5 size-4" /> Heatmap coming soon
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <AdminContent />
    </RequireAuth>
  );
}