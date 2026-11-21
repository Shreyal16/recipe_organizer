import React from 'react';
import MealSlotCard from './MealSlotCard';
import { MEAL_TYPES } from '../../utils/constants';

export default function DayColumn({
  dayInfo,
  dayData,
  onAddMealToSlot,
  onRemoveMealFromSlot,
  onUpdateServingsInSlot,
  disabled = false,
}) {
  const meals = (dayData && dayData.meals) || [];

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border shadow-xs flex flex-col overflow-hidden transition-colors">
      {/* Day Header */}
      <div
        className={`
          px-3.5 py-3 border-b flex items-center justify-between transition-colors
          ${
            dayInfo.isToday
              ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800/60'
              : 'bg-surface-subtle/40 border-surface-border'
          }
        `}
      >
        <div>
          <span className="text-xs font-bold text-surface-text block">
            {dayInfo.name}
          </span>
          <span className="text-[11px] text-surface-muted font-medium">
            {dayInfo.formattedDate}
          </span>
        </div>
        {dayInfo.isToday && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white shadow-2xs">
            Today
          </span>
        )}
      </div>

      {/* 4 Meal Slots */}
      <div className="p-2.5 space-y-2.5 flex-1 flex flex-col justify-between">
        {MEAL_TYPES.map((type) => {
          const slotMeals = meals.filter((m) => m.mealType === type);

          return (
            <MealSlotCard
              key={type}
              dayDate={dayInfo.dateString}
              dayName={dayInfo.name}
              mealType={type}
              meals={slotMeals}
              onAddMeal={(t) => onAddMealToSlot(dayInfo.dateString, t)}
              onRemoveMeal={(m) => onRemoveMealFromSlot(dayInfo.dateString, m)}
              onUpdateServings={(m, newServings) =>
                onUpdateServingsInSlot(dayInfo.dateString, m, newServings)
              }
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}
