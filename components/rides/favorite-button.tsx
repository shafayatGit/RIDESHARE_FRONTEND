"use client";

import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/favorites-context";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import * as React from "react";

export interface FavoriteButtonProps {
  riderId: string;
  riderName: string;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline";
  className?: string;
  /** Render as a compact icon-only control for dense card layouts. */
  iconOnly?: boolean;
}

export function FavoriteButton({
  riderId,
  riderName,
  size = "default",
  variant = "ghost",
  className,
  iconOnly = true,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, pendingRiderId } = useFavorites();
  const active = isFavorite(riderId);
  const pending = pendingRiderId === riderId;
  const label = active
    ? `Remove ${riderName} from favorites`
    : `Add ${riderName} to favorites`;

  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon-sm" : size}
      aria-pressed={active}
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggleFavorite(riderId);
      }}
      className={cn(iconOnly && "shrink-0", className)}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          active && "fill-destructive text-destructive",
        )}
      />
      {!iconOnly && <span>{active ? "Favorited" : "Favorite"}</span>}
    </Button>
  );
}