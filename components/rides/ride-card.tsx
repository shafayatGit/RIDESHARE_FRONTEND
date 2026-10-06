import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { formatCurrency, formatTime, initials } from "@/lib/format";
import type { Ride } from "@/lib/types";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "./favorite-button";

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
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <StarRating
                    value={Math.round(ride.driver.avgRatingAsDriver)}
                    readOnly
                    size="sm"
                    label={`${driverName} rating`}
                  />
                  <span className="font-medium text-foreground">
                    {ride.driver.avgRatingAsDriver.toFixed(1)}
                  </span>
                  {ride.driver.ratingCount ? (
                    <span className="text-muted-foreground/70">
                      ({ride.driver.ratingCount})
                    </span>
                  ) : (
                    <span>· no ratings yet</span>
                  )}
                </span>
              )}
              {ride.driver && (
                <FavoriteButton
                  riderId={ride.driver.id}
                  riderName={driverName}
                />
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
