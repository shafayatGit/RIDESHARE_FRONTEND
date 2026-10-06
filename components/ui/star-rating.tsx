"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import * as React from "react";

const MAX_RATING = 5;

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  /** Hides the inputs and renders a static, non-interactive summary. */
  readOnly?: boolean;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  label?: string;
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  size = "default",
  className,
  label = "Rating",
}: StarRatingProps) {
  const name = React.useId();
  const [hovered, setHovered] = React.useState<number | null>(null);
  const interactive = !readOnly && typeof onChange === "function";
  const active = interactive && hovered !== null ? hovered : value;
  const iconSize = size === "sm" ? "size-3.5" : "size-5";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5",
        interactive && "cursor-pointer",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: MAX_RATING }, (_, i) => {
        const score = i + 1;
        const filled = score <= active;

        if (!interactive) {
          return (
            <Star
              key={score}
              aria-hidden="true"
              className={cn(
                iconSize,
                filled
                  ? "fill-current text-amber-500"
                  : "text-muted-foreground/30",
              )}
            />
          );
        }

        return (
          <label
            key={score}
            className="cursor-pointer p-0.5"
            onMouseEnter={() => setHovered(score)}
          >
            <input
              type="radio"
              name={name}
              value={score}
              checked={value === score}
              onChange={() => onChange(score)}
              disabled={disabled}
              className="sr-only"
              aria-label={`${score} ${score === 1 ? "star" : "stars"}`}
            />
            <Star
              aria-hidden="true"
              className={cn(
                iconSize,
                "transition-colors",
                filled ? "fill-current text-amber-500" : "text-muted-foreground/30",
              )}
            />
          </label>
        );
      })}
      {!interactive && (
        <span className="sr-only" aria-label={`${label}: ${value} out of ${MAX_RATING}`}>
          {value} out of {MAX_RATING}
        </span>
      )}
    </div>
  );
}