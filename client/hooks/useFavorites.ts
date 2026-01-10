import { useEffect, useState } from "react";
import { Favorite } from "@/lib/assetService";
import * as assetService from "@/lib/assetService";

/**
 * Hook to get user's favorite assets with real-time updates
 */
export function useFavorites(userId: string | undefined) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = assetService.subscribeToUserFavorites(
      userId,
      (favorites) => {
        setFavorites(favorites);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  return { favorites, loading, error };
}

/**
 * Hook to add asset to favorites
 */
export function useAddToFavorites() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToFavorites = async (
    userId: string,
    assetId: string,
    assetName: string,
    assetImage: string,
    authorId: string,
    authorName: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const favoriteId = await assetService.addToFavorites(
        userId,
        assetId,
        assetName,
        assetImage,
        authorId,
        authorName,
      );
      return favoriteId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error adding to favorites";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addToFavorites, loading, error };
}

/**
 * Hook to remove asset from favorites
 */
export function useRemoveFromFavorites() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeFromFavorites = async (userId: string, assetId: string) => {
    try {
      setLoading(true);
      setError(null);
      await assetService.removeFromFavorites(userId, assetId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error removing from favorites";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { removeFromFavorites, loading, error };
}

/**
 * Hook to check if asset is favorited
 */
export function useIsFavorited(
  userId: string | undefined,
  assetId: string | undefined,
) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !assetId) {
      setIsFavorited(false);
      setLoading(false);
      return;
    }

    const checkFavorite = async () => {
      try {
        setLoading(true);
        const result = await assetService.isFavorited(userId, assetId);
        setIsFavorited(result);
      } catch (err) {
        console.error("Error checking favorite status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkFavorite();
  }, [userId, assetId]);

  return { isFavorited, loading };
}
