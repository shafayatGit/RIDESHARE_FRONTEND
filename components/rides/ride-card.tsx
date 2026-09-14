import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatTime, initials } from "@/lib/format";
import type { Ride } from "@/lib/types";
import { MapPin, Star } from "lucide-react";
import Link from "next/link";

export function isEcoBonus(ride: Ride) {
  return ride.totalSeats - ride.availableSeats >= 1;
}

export function RideCard({ ride }: { ride: Ride }) {
  const driverName = ride.driver?.name ?? "Driver";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <Avatar size="lg">
            <AvatarImage src={ride.driver?.image ?? undefined} alt={driverName} />
            <AvatarFallback>{initials(driverName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{driverName}</span>
              {ride.driver && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="size-3 fill-current text-amber-500" />
                  {ride.driver.avgRatingAsDriver.toFixed(1)}
                </span>
              )}
              {ride.isFemaleOnly && <Badge variant="secondary">Female-Only</Badge>}
              {isEcoBonus(ride) && <Badge variant="eco">Eco-Bonus</Badge>}
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-primary" />
                {ride.originAddress}
                <span className="text-xs">· {formatTime(ride.departureTime)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                {ride.destinationAddress}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              {ride.availableSeats} seat{ride.availableSeats === 1 ? "" : "s"} left
            </div>
            <div className="text-lg font-semibold text-primary">
              {formatCurrency(ride.pricePerSeat)}
            </div>
          </div>
          <Button asChild size="sm">
            <Link href={`/find/${ride.id}`}>Book Ride</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
