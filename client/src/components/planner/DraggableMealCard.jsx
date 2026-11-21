import React from 'react';
import { Link } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Trash2, AlertCircle, Minus, Plus } from 'lucide-react';
import { DEFAULT_RECIPE_IMAGE } from '../../utils/constants';

export default function DraggableMealCard({
  meal,
  dayDate,
  mealType,
  onRemoveMeal,
  onUpdateServings,
  disabled = false,
}) {
  const mealId = (meal._id || meal.id || '').toString();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: mealId,
    data: {
      meal,
      dayDate,
      mealType,
    },
    disabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const recipe = meal.recipeId;
  const isUnavailable = !recipe || typeof recipe !== 'object';

  if (isUnavailable) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-2.5 text-xs flex items-center justify-between text-amber-900 dark:text-amber-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-medium text-[11px]">Recipe Deleted</span>
        </div>
        <button
          type="button"
          onClick={() => onRemoveMeal(meal)}
          className="text-surface-muted hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md transition-colors"
          title="Remove stale reference"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-surface-card rounded-xl p-2 border border-surface-border shadow-2xs transition-all duration-150 flex items-center justify-between gap-1.5
        ${isDragging ? 'opacity-30 border-dashed border-brand-500 shadow-none' : 'hover:border-brand-500/40 hover:shadow-xs'}
      `}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {/* Visible Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          className="p-1 -ml-0.5 rounded-md text-surface-muted hover:text-brand-600 dark:hover:text-brand-400 hover:bg-surface-subtle focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
          title="Drag meal to reschedule"
          aria-label={`Drag ${recipe.title} to another meal slot`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Thumbnail Image */}
        <img
          src={recipe.imageUrl || DEFAULT_RECIPE_IMAGE}
          alt={recipe.title}
          onError={(e) => {
            e.target.src = DEFAULT_RECIPE_IMAGE;
          }}
          className="w-9 h-9 rounded-lg object-cover bg-surface-subtle shrink-0"
        />

        {/* Title & Servings Controls */}
        <div className="min-w-0 flex-1">
          <Link
            to={`/recipes/${recipe._id}`}
            className="text-xs font-bold text-surface-text hover:text-brand-600 dark:hover:text-brand-400 block truncate transition-colors"
          >
            {recipe.title}
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] text-surface-muted mt-0.5">
            <span className="font-semibold text-surface-text">{meal.servings || 1} serv</span>
            <div className="inline-flex items-center gap-0.5 ml-1">
              <button
                type="button"
                disabled={disabled || (meal.servings || 1) <= 1}
                onClick={() => onUpdateServings(meal, (meal.servings || 1) - 1)}
                className="w-4 h-4 rounded bg-surface-subtle hover:bg-surface-border flex items-center justify-center text-surface-text disabled:opacity-30 transition-colors"
                title="Decrease servings"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onUpdateServings(meal, (meal.servings || 1) + 1)}
                className="w-4 h-4 rounded bg-surface-subtle hover:bg-surface-border flex items-center justify-center text-surface-text transition-colors"
                title="Increase servings"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete / Remove Action Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRemoveMeal(meal)}
        className="p-1.5 text-surface-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0 disabled:opacity-40"
        title="Remove meal from schedule"
        aria-label={`Remove ${recipe.title}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
