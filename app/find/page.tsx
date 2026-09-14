"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { RequireAuth } from "@/components/auth/require-auth";
import { RideCard } from "@/components/rides/ride-card";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/lib/api";
import type { Ride } from "@/lib/types";
import { Leaf, Search } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type TimeBucket = "morning" | "afternoon" | "evening";

const timeBuckets: { key: TimeBucket; label: string; range: string }[] = [
  { key: "morning", label: "Morning", range: "6am-12pm" },
  { key: "afternoon", label: "Afternoon", range: "12pm-5pm" },
  { key: "evening", label: "Evening", range: "5pm-10pm" },
];

function bucketFor(departureTime: string): TimeBucket {
  const hour = new Date(departureTime).getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function FindRidePage() {
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [buckets, setBuckets] = React.useState<Set<TimeBucket>>(new Set());
  const [priceRange, setPriceRange] = React.useState([0, 25]);
  const [femaleOnly, setFemaleOnly] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(6);

  React.useEffect(() => {
    api
      .get<Ride[]>("/ride")
      .then(setRides)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load rides"))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleBucket = (bucket: TimeBucket) => {
    setBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket);
      else next.add(bucket);
      return next;
    });
  };

  const filteredRides = rides.filter((ride) => {
    if (buckets.size > 0 && !buckets.has(bucketFor(ride.departureTime))) return false;
    const price = Number(ride.pricePerSeat);
    if (price < priceRange[0] || price > priceRange[1]) return false;
    if (femaleOnly && !ride.isFemaleOnly) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !ride.originAddress.toLowerCase().includes(q) &&
        !ride.destinationAddress.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Available Rides</h1>
              <p className="text-sm text-muted-foreground">
                Find a safe, green commute to campus today.
              </p>
            </div>
            <Input
              startIcon={Search}
              placeholder="Search destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="flex flex-col gap-4">
              <Card>
                <CardContent className="flex flex-col gap-5">
                  <div>
                    <h2 className="mb-3 text-sm font-medium">Departure Time</h2>
                    <div className="flex flex-col gap-2.5">
                      {timeBuckets.map((bucket) => (
                        <div key={bucket.key} className="flex items-center gap-2">
                          <Checkbox
                            id={bucket.key}
                            checked={buckets.has(bucket.key)}
                            onCheckedChange={() => toggleBucket(bucket.key)}
                          />
                          <Label htmlFor={bucket.key} className="text-sm font-normal">
                            {bucket.label} ({bucket.range})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="mb-3 text-sm font-medium">
                      Price Range (${priceRange[0]}-${priceRange[1]})
                    </h2>
                    <Slider
                      min={0}
                      max={25}
                      step={1}
                      value={priceRange}
                      onValueChange={setPriceRange}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="female-only" className="text-sm font-normal">
                      Female-Only Rides
                    </Label>
                    <Switch id="female-only" checked={femaleOnly} onCheckedChange={setFemaleOnly} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-accent/30">
                <CardContent className="flex items-start gap-2 text-sm">
                  <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>Riding together saves an average of 2.4kg of CO2 per shared trip.</p>
                </CardContent>
              </Card>
            </aside>

            <div className="flex flex-col gap-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))
              ) : filteredRides.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    No rides match your filters right now. Try widening your search.
                  </CardContent>
                </Card>
              ) : (
                <>
                  {filteredRides.slice(0, visibleCount).map((ride) => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                  {visibleCount < filteredRides.length && (
                    <button
                      onClick={() => setVisibleCount((c) => c + 6)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      See more rides
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </RequireAuth>
  );
}
