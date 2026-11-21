import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import DraggableMealCard from './DraggableMealCard';
import { Plus } from 'lucide-react';

export default function MealSlotCard({
  dayDate,
  dayName,
  mealType,
  meals = [],
  onAddMeal,
  onRemoveMeal,
  onUpdateServings,
  disabled = false,
}) {
  const droppableId = `${dayDate}::${mealType}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: {
      dayDate,
      dayName,
      mealType,
    },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-xl p-2.5 border transition-all duration-150 min-h-[110px] flex flex-col justify-between
        ${
          isOver
            ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/15 ring-2 ring-brand-500/40'
            : 'bg-surface-canvas border-surface-border/80'
        }
      `}
    >
      {/* Slot Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-surface-muted">
          {mealType}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAddMeal(mealType)}
          className="p-1 rounded-md text-brand-600 dark:text-brand-400 hover:bg-surface-subtle transition-colors disabled:opacity-40"
          title={`Add ${mealType}`}
          aria-label={`Add recipe to ${dayName || ''} ${mealType}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Meals in this slot */}
      <div className="space-y-1.5 flex-1">
        {meals.length === 0 ? (
          <div
            onClick={() => !disabled && onAddMeal(mealType)}
            className={`
              h-14 border border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all text-xs
              ${
                isOver
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-500/5'
                  : 'border-surface-border/80 hover:border-brand-400 hover:bg-surface-subtle text-surface-muted'
              }
            `}
          >
            <span>+ Drop or Add {mealType}</span>
          </div>
        ) : (
          meals.map((meal, mIdx) => (
            <DraggableMealCard
              key={(meal._id || meal.id || `${dayDate}-${mealType}-${mIdx}`).toString()}
              meal={meal}
              dayDate={dayDate}
              mealType={mealType}
              onRemoveMeal={onRemoveMeal}
              onUpdateServings={onUpdateServings}
              disabled={disabled}
            />
          ))
        )}
      </div>
    </div>
  );
}
