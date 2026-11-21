import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import favoriteService from '../services/favoriteService';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await favoriteService.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Failed to load favorites:', err.message);
      setError(err.message || 'Could not load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Set of recipe ID strings for O(1) membership check
  const favoriteIds = useMemo(() => {
    const set = new Set();
    favorites.forEach((fav) => {
      // Check both rawRecipeId and populated recipeId._id
      if (fav.rawRecipeId) {
        set.add(fav.rawRecipeId);
      } else if (fav.recipeId && fav.recipeId._id) {
        set.add(fav.recipeId._id);
      }
    });
    return set;
  }, [favorites]);

  const isFavorite = useCallback(
    (recipeId) => {
      if (!recipeId) return false;
      return favoriteIds.has(recipeId.toString());
    },
    [favoriteIds]
  );

  const addFavorite = useCallback(
    async (recipeId) => {
      if (!recipeId) return;
      try {
        const res = await favoriteService.addFavorite(recipeId);
        if (res.data) {
          setFavorites((prev) => [res.data, ...prev]);
        }
      } catch (err) {
        // If conflict (409), refresh to sync
        if (err.status === 409) {
          await fetchFavorites();
        } else {
          throw err;
        }
      }
    },
    [fetchFavorites]
  );

  const removeFavorite = useCallback(async (recipeId) => {
    if (!recipeId) return;
    try {
      await favoriteService.removeFavorite(recipeId);
      setFavorites((prev) =>
        prev.filter((fav) => {
          const raw = fav.rawRecipeId || (fav.recipeId && fav.recipeId._id);
          return raw !== recipeId.toString();
        })
      );
    } catch (err) {
      if (err.status === 404) {
        // Already removed, sync locally
        setFavorites((prev) =>
          prev.filter((fav) => {
            const raw = fav.rawRecipeId || (fav.recipeId && fav.recipeId._id);
            return raw !== recipeId.toString();
          })
        );
      } else {
        throw err;
      }
    }
  }, []);

  const toggleFavorite = useCallback(
    async (recipeId) => {
      if (isFavorite(recipeId)) {
        await removeFavorite(recipeId);
      } else {
        await addFavorite(recipeId);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  const value = {
    favorites,
    favoriteIds,
    loading,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refreshFavorites: fetchFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;
