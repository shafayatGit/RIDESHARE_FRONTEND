"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import type { Rating } from "@/lib/types";
import * as React from "react";
import { toast } from "sonner";

const REVIEW_MAX_LENGTH = 500;

export interface RatingDialogProps {
  riderId: string | null;
  riderName: string;
  /** Shown when editing an existing rating, e.g. "5 out of 5". */
  currentRating?: number | null;
  /** Prefilled so editing a rating does not wipe the existing review. */
  currentReview?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRated?: (rating: Rating) => void;
}

/** Rates a rider, not a single ride. */
export function RatingDialog({
  riderId,
  riderName,
  currentRating,
  currentReview,
  open,
  onOpenChange,
  onRated,
}: RatingDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset during render when the dialog opens for a different rider, so the
  // previous rider's draft never leaks into the next one.
  const draftKey = open ? (riderId ?? "none") : "closed";
  const [draft, setDraft] = React.useState({
    key: draftKey,
    rating: currentRating ?? 0,
    review: currentReview ?? "",
  });

  if (draft.key !== draftKey) {
    setDraft({
      key: draftKey,
      rating: currentRating ?? 0,
      review: currentReview ?? "",
    });
  }

  const { rating, review } = draft;

  const handleSubmit = async () => {
    if (!riderId || rating === 0) return;
    setIsSubmitting(true);
    try {
      const created = await api.post<Rating>("/rating/create", {
        riderId,
        rating,
        review: review.trim() || undefined,
      });
      toast.success(
        currentRating
          ? `Your rating for ${riderName} was updated`
          : `Thanks — ${riderName} now has a ${rating}-star rating`,
      );
      onRated?.(created);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not submit your rating",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(currentRating);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Update your rating for" : "Rate"} {riderName}
          </DialogTitle>
          <DialogDescription>
            Your rating applies to {riderName} overall.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label id="rating-label">
            {isEditing ? "Change your score" : "How was riding with them?"}
          </Label>
          <div className="flex items-center gap-3">
            <StarRating
              value={rating}
              onChange={(next) => setDraft((d) => ({ ...d, rating: next }))}
              label={`Rate ${riderName}`}
            />
            <span className="text-sm text-muted-foreground">
              {rating === 0 ? "Tap to rate" : `${rating} / 5`}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rating-review">Add a comment (optional)</Label>
          <Textarea
            id="rating-review"
            placeholder="Great driver, smooth pickup at the library gate…"
            value={review}
            maxLength={REVIEW_MAX_LENGTH}
            onChange={(e) => setDraft((d) => ({ ...d, review: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            {review.length}/{REVIEW_MAX_LENGTH} characters
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}