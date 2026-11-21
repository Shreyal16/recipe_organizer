import React from 'react';
import { GripVertical } from 'lucide-react';
import { DEFAULT_RECIPE_IMAGE } from '../../utils/constants';

export default function MealCardOverlay({ meal }) {
  if (!meal) return null;
  const recipe = meal.recipeId;
  const title = (recipe && recipe.title) || 'Meal';
  const imageUrl = (recipe && recipe.imageUrl) || DEFAULT_RECIPE_IMAGE;

  return (
    <div className="bg-surface-card rounded-xl p-2.5 border-2 border-brand-500 shadow-xl flex items-center gap-2 max-w-xs cursor-grabbing pointer-events-none rotate-1 scale-102 transition-transform">
      <div className="p-1 text-brand-600 dark:text-brand-400">
        <GripVertical className="w-4 h-4" />
      </div>
      <img
        src={imageUrl}
        alt={title}
        onError={(e) => {
          e.target.src = DEFAULT_RECIPE_IMAGE;
        }}
        className="w-9 h-9 rounded-lg object-cover bg-surface-subtle shrink-0"
      />
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-bold text-surface-text truncate">{title}</h4>
        <span className="text-[11px] text-surface-muted block mt-0.5">
          {meal.servings || 1} serving(s) • Moving...
        </span>
      </div>
    </div>
  );
}
