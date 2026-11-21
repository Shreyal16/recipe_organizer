import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import RecipeCard from '../components/recipes/RecipeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import Button from '../components/common/Button';
import { Heart, Trash2, AlertCircle, UtensilsCrossed } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, loading, error, removeFavorite, refreshFavorites } = useFavorites();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Favorite Recipes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your personal collection of saved, loved, and bookmarked meals.
          </p>
        </div>

        <Link to="/recipes">
          <Button variant="secondary" icon={UtensilsCrossed} size="sm">
            Explore More Recipes
          </Button>
        </Link>
      </div>

      {error && <ErrorBanner message={error} onRetry={refreshFavorites} />}

      {loading ? (
        <LoadingSpinner text="Loading your favorites..." fullScreen />
      ) : favorites.length === 0 ? (
        <EmptyState
          title="No favorites saved yet"
          description="Browse the recipe explorer and click the heart icon on any recipe to save it here for quick access."
          icon={Heart}
          actionLabel="Browse Recipes"
          onAction={() => window.location.assign('/recipes')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav) => {
            const recipe = fav.recipeId;
            const targetRecipeId = fav.rawRecipeId || (recipe && recipe._id);

            // Handle stale / deleted recipe reference gracefully
            if (!recipe || typeof recipe !== 'object') {
              return (
                <div
                  key={fav._id}
                  className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      Recipe Unavailable
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      This recipe was deleted from the collection. You can safely remove it from your favorites list.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className="text-red-600 hover:bg-red-50 text-xs"
                      onClick={() => removeFavorite(targetRecipeId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <RecipeCard
                key={fav._id}
                recipe={recipe}
                showActions={false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
