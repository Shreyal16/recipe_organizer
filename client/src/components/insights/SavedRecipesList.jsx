import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, Utensils, ArrowRight } from 'lucide-react';

export default function SavedRecipesList({ recipes = [] }) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[220px] text-center">
        <Heart className="w-10 h-10 text-surface-muted mb-2 opacity-50" />
        <h4 className="text-sm font-semibold text-surface-text">No Saved Recipes Yet</h4>
        <p className="text-xs text-surface-muted mt-1 max-w-xs">
          Explore recipes and tap the heart icon to save your favorites for personalized recommendations.
        </p>
        <Link
          to="/recipes"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
        >
          Explore Recipes <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-surface-text flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            Your Saved Recipes
          </h3>
          <p className="text-xs text-surface-muted mt-0.5">
            Favorites in your profile used to inform your culinary preferences
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
          {recipes.length} Saved
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {recipes.map((item) => {
          const recipeId = item._id;
          return (
            <Link
              key={recipeId}
              to={`/recipes/${recipeId}`}
              className="group flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface-canvas hover:border-brand-500/50 hover:bg-surface-subtle transition-all duration-150"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0 bg-surface-subtle"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0 text-surface-muted">
                  <Utensils className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-surface-text truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-surface-muted">
                  <span className="inline-flex items-center gap-1">
                    <Utensils className="w-3 h-3" />
                    {item.cuisine || 'General'}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.prepTimeMinutes ? `${item.prepTimeMinutes}m` : '15m'}
                  </span>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-surface-muted group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
