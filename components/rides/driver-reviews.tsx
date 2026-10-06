"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StarRating } from "@/components/ui/star-rating";
import { api } from "@/lib/api";
import { formatDateTime, initials } from "@/lib/format";
import type { Rating } from "@/lib/types";
import { Star } from "lucide-react";
import * as React from "react";

interface ReviewsState {
  riderId: string;
  isLoading: boolean;
  ratings: Rating[];
}

export function DriverReviews({ riderId }: { riderId: string }) {
  const [state, setState] = React.useState<ReviewsState>({
    riderId,
    isLoading: true,
    ratings: [],
  });

  // Reset during render when the driver changes, so a previous driver's reviews
  // can never flash while the next request is in flight.
  if (state.riderId !== riderId) {
    setState({ riderId, isLoading: true, ratings: [] });
  }

  React.useEffect(() => {
    let cancelled = false;
    api
      .get<Rating[]>(`/rating/rider/${riderId}`)
      .then((data) => {
        if (cancelled) return;
        setState({ riderId, isLoading: false, ratings: data });
      })
      // Reviews are supplementary; a failure must not break the ride page.
      .catch(() => {
        if (cancelled) return;
        setState({ riderId, isLoading: false, ratings: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [riderId]);

  const { isLoading, ratings } = state;

  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Driver Reviews</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Spinner /> Loading reviews…
          </div>
        ) : ratings.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No reviews yet — be the first to rate this driver after a completed
            ride.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <StarRating value={Math.round(average)} readOnly size="sm" />
              <span className="text-sm font-medium">
                {average.toFixed(1)} out of 5
              </span>
              <span className="text-sm text-muted-foreground">
                · {ratings.length} review{ratings.length === 1 ? "" : "s"}
              </span>
            </div>

            <ul className="flex flex-col gap-4">
              {ratings.map((rating) => (
                <li key={rating.id} className="flex gap-3">
                  <Avatar>
                    <AvatarImage
                      src={rating.rater?.image ?? undefined}
                      alt={rating.rater?.name}
                    />
                    <AvatarFallback>
                      {initials(rating.rater?.name ?? "P")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {rating.rater?.name ?? "Passenger"}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Star className="size-3 fill-current text-amber-500" />
                        {rating.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(rating.createdAt)}
                      </span>
                    </div>
                    {rating.review && (
                      <p className="mt-1 text-sm">{rating.review}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}