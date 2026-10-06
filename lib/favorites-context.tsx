"use client";

import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Favorite } from "@/lib/types";
import * as React from "react";
import { toast } from "sonner";

interface FavoritesContextValue {
  favorites: Favorite[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  pendingRiderId: string | null;
  isFavorite: (riderId: string) => boolean;
  toggleFavorite: (riderId: string) => Promise<void>;
}

interface FavoritesState {
  /** The user these favorites belong to; guards against stale data across accounts. */
  ownerId: string | null;
  isLoading: boolean;
  favorites: Favorite[];
}

const FavoritesContext = React.createContext<FavoritesContextValue | null>(null);

/**
 * Fetches the signed-in passenger's favorite riders once and shares it, so a
 * heart rendered on a ride card, the ride page and the profile all stay in sync
 * without each instance hitting `/favorite`.
 */
export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;

  const [state, setState] = React.useState<FavoritesState>({
    ownerId,
    isLoading: ownerId !== null,
    favorites: [],
  });

  // Reset during render when the signed-in account changes, rather than in an
  // effect, so switching users can never show the previous account's drivers.
  if (state.ownerId !== ownerId) {
    setState({ ownerId, isLoading: ownerId !== null, favorites: [] });
  }

  const [pendingRiderId, setPendingRiderId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (!ownerId) return;
    let cancelled = false;
    api
      .get<Favorite[]>("/favorite")
      .then((data) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, favorites: data, isLoading: false }));
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, favorites: [], isLoading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const favorites = state.favorites;
  const favoriteIds = React.useMemo(
    () => new Set(favorites.map((f) => f.riderId)),
    [favorites],
  );

  const isFavorite = React.useCallback(
    (riderId: string) => favoriteIds.has(riderId),
    [favoriteIds],
  );

  const toggleFavorite = React.useCallback(
    async (riderId: string) => {
      if (!ownerId) {
        toast.error("Sign in to save favorite drivers");
        return;
      }
      if (pendingRiderId) return;

      const wasFavorite = favoriteIds.has(riderId);
      const rollback = favorites;
      setPendingRiderId(riderId);

      // Optimistic so the heart never lags behind the click.
      setState((prev) => ({
        ...prev,
        favorites: wasFavorite
          ? prev.favorites.filter((f) => f.riderId !== riderId)
          : [
              {
                id: `optimistic-${riderId}`,
                passengerId: ownerId,
                riderId,
                createdAt: new Date().toISOString(),
                rider: {
                  id: riderId,
                  name: "",
                  image: null,
                  isVerified: false,
                  avgRatingAsDriver: 0,
                  ratingCount: 0,
                },
              },
              ...prev.favorites,
            ],
      }));

      try {
        if (wasFavorite) {
          await api.delete(`/favorite/${riderId}`);
          toast.success("Removed from favorite drivers");
        } else {
          const created = await api.post<Favorite>("/favorite/create", {
            riderId,
          });
          setState((prev) => ({
            ...prev,
            favorites: prev.favorites.map((f) =>
              f.id === `optimistic-${riderId}` ? created : f,
            ),
          }));
          toast.success("Saved to favorite drivers");
        }
      } catch (err) {
        setState((prev) => ({ ...prev, favorites: rollback }));
        toast.error(
          err instanceof ApiError ? err.message : "Could not update favorites",
        );
      } finally {
        setPendingRiderId(null);
      }
    },
    [favoriteIds, favorites, ownerId, pendingRiderId],
  );

  const value = React.useMemo(
    () => ({
      favorites,
      favoriteIds,
      isLoading: state.isLoading,
      pendingRiderId,
      isFavorite,
      toggleFavorite,
    }),
    [
      favorites,
      favoriteIds,
      state.isLoading,
      pendingRiderId,
      isFavorite,
      toggleFavorite,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = React.useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }

  return context;
}