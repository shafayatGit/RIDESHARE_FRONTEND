"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import * as React from "react";
import { api, ApiError } from "@/lib/api";
import type { Ride } from "@/lib/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const placeholderImages = [
  "/destinations/north-campus.jpg",
  "/destinations/west-side.jpg",
  "/destinations/library-loop.jpg",
];

export function TrendingDestinations() {
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<Ride[]>("/ride")
      .then(setRides)
      .catch((err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Failed to load routes",
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const topDestinations = React.useMemo(() => {
    if (!rides.length) return [];

    const routeCount = new Map<
      string,
      {
        origin: string;
        destination: string;
        count: number;
        minPrice: number;
        totalPrice: number;
      }
    >();

    for (const ride of rides) {
      const key = `${ride.originAddress}|${ride.destinationAddress}`;
      const price = Number(ride.pricePerSeat);
      const existing = routeCount.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalPrice += price;
        existing.minPrice = Math.min(existing.minPrice, price);
      } else {
        routeCount.set(key, {
          origin: ride.originAddress,
          destination: ride.destinationAddress,
          count: 1,
          minPrice: price,
          totalPrice: price,
        });
      }
    }

    return Array.from(routeCount.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([key, data], idx) => ({
        key,
        name: data.destination,
        location: data.origin,
        price: `$${data.minPrice}/seat`,
        discount: `${data.count} ride${data.count > 1 ? "s" : ""} active`,
        image: placeholderImages[idx % placeholderImages.length],
      }));
  }, [rides]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Trending Destinations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The most frequent routes currently active on campus.
          </p>
        </div>
        <Link
          href="/find"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View All Routes <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))
          : topDestinations.map((dest) => (
              <Card key={dest.key} className="overflow-hidden py-0">
                <div className="relative h-40 w-full">
                  <Image
                    src={dest.image}
                    alt={dest.name}
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute left-3 top-3 bg-background text-foreground">
                    {dest.discount}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{dest.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> From {dest.location}
                  </p>
                  <p className="mt-3 font-medium text-primary">{dest.price}</p>
                </div>
              </Card>
            ))}
      </div>
    </section>
  );
}
