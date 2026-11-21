import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Select from '../common/Select';
import Input from '../common/Input';
import ErrorBanner from '../common/ErrorBanner';
import mealPlanService from '../../services/mealPlanService';
import { getMondayString, getWeekDays, shiftWeek } from '../../utils/dateUtils';
import { MEAL_TYPES } from '../../utils/constants';

export default function AddToMealPlanModal({
  isOpen,
  onClose,
  recipe,
  onSuccess,
}) {
  const [monday, setMonday] = useState(() => getMondayString());
  const [selectedDayDate, setSelectedDayDate] = useState(() => getMondayString());
  const [mealType, setMealType] = useState('Dinner');
  const [servings, setServings] = useState(recipe ? recipe.servings || 2 : 2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const weekDays = getWeekDays(monday);

  const handleWeekChange = (offset) => {
    const newMonday = shiftWeek(monday, offset);
    setMonday(newMonday);
    setSelectedDayDate(newMonday);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!recipe) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch current weekly plan for selected Monday
      let currentPlan = null;
      try {
        const res = await mealPlanService.getMealPlan(monday);
        currentPlan = res.data;
      } catch (err) {
        // If 404, plan does not exist yet (expected)
      }

      const mealEntry = {
        mealType,
        recipeId: recipe._id,
        servings: Number(servings) || 1,
      };

      if (!currentPlan) {
        // Create new plan with 7 days and this meal assigned
        const newDays = weekDays.map((d) => ({
          date: d.dateString,
          meals: d.dateString === selectedDayDate ? [mealEntry] : [],
        }));

        await mealPlanService.createMealPlan({
          weekStartDate: monday,
          days: newDays,
        });
      } else {
        // Update existing plan
        const updatedDays = currentPlan.days.map((d) => {
          const dString = new Date(d.date).toISOString().split('T')[0];
          if (dString === selectedDayDate) {
            return {
              ...d,
              meals: [
                ...d.meals.map((m) => ({
                  mealType: m.mealType,
                  recipeId: m.recipeId ? m.recipeId._id || m.recipeId : m.rawRecipeId,
                  servings: m.servings,
                })),
                mealEntry,
              ],
            };
          }
          return {
            ...d,
            meals: d.meals.map((m) => ({
              mealType: m.mealType,
              recipeId: m.recipeId ? m.recipeId._id || m.recipeId : m.rawRecipeId,
              servings: m.servings,
            })),
          };
        });

        await mealPlanService.updateMealPlan(currentPlan._id, {
          days: updatedDays,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add recipe to meal plan:', err);
      setError(err.message || 'Failed to schedule meal.');
    } finally {
      setLoading(false);
    }
  };

  if (!recipe) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule: ${recipe.title}`} maxWidth="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        {/* Week Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Select Week
          </label>
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-semibold text-gray-800">
            <button
              type="button"
              onClick={() => handleWeekChange(-1)}
              className="px-2 py-1 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200"
            >
              ← Prev
            </button>
            <span>Week of {monday}</span>
            <button
              type="button"
              onClick={() => handleWeekChange(1)}
              className="px-2 py-1 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Day of Week */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Day of Week
          </label>
          <select
            value={selectedDayDate}
            onChange={(e) => setSelectedDayDate(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:ring-brand-500 focus:border-brand-500 bg-white"
          >
            {weekDays.map((d) => (
              <option key={d.dateString} value={d.dateString}>
                {d.name} ({d.formattedDate})
              </option>
            ))}
          </select>
        </div>

        {/* Meal Type */}
        <Select
          label="Meal Slot"
          options={MEAL_TYPES}
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
        />

        {/* Servings */}
        <Input
          label="Servings to Prepare"
          type="number"
          min={1}
          required
          value={servings}
          onChange={(e) => setServings(e.target.value)}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Add to Meal Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
