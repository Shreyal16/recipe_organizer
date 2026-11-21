import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import mealPlanService from '../../services/mealPlanService';
import { getMondayString, getWeekDays } from '../../utils/dateUtils';
import Button from '../common/Button';
import Modal from '../common/Modal';
import {
  Sparkles,
  Utensils,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  ArrowRight,
} from 'lucide-react';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function RecommendationsList({ recommendations = [], onMealAdded }) {
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState(null);
  const [targetDayIndex, setTargetDayIndex] = useState(0); // 0 = Mon, 6 = Sun
  const [targetMealType, setTargetMealType] = useState('Dinner');
  const [addingToPlan, setAddingToPlan] = useState(false);
  const [planSuccessMsg, setPlanSuccessMsg] = useState('');
  const [planErrorMsg, setPlanErrorMsg] = useState('');

  const currentMonday = getMondayString();
  const weekDays = getWeekDays(currentMonday);

  const handleOpenAddModal = (recipe) => {
    setSelectedRecipeForPlan(recipe);
    setPlanSuccessMsg('');
    setPlanErrorMsg('');
  };

  const handleConfirmAddToPlan = async () => {
    if (!selectedRecipeForPlan) return;
    try {
      setAddingToPlan(true);
      setPlanErrorMsg('');

      const targetDay = weekDays[targetDayIndex];
      const targetDateString = targetDay.dateString;

      const newMeal = {
        mealType: targetMealType,
        recipeId: selectedRecipeForPlan._id,
        servings: selectedRecipeForPlan.servings || 2,
      };

      // 1. Fetch current week's plan
      let existingPlan = null;
      try {
        const res = await mealPlanService.getMealPlan(currentMonday);
        existingPlan = res.data;
      } catch (err) {
        if (err.status !== 404) throw err;
      }

      if (!existingPlan) {
        // Create new plan for this week
        const newDays = weekDays.map((d) => ({
          date: d.dateString,
          meals: d.dateString === targetDateString ? [newMeal] : [],
        }));
        await mealPlanService.createMealPlan({
          weekStartDate: currentMonday,
          days: newDays,
        });
      } else {
        // Update existing plan
        const updatedDays = (existingPlan.days || []).map((day) => {
          const dStr = new Date(day.date).toISOString().split('T')[0];
          const validMeals = (day.meals || [])
            .filter((m) => m.recipeId)
            .map((m) => ({
              mealType: m.mealType,
              recipeId: typeof m.recipeId === 'object' ? m.recipeId._id : m.recipeId,
              servings: m.servings,
            }));

          if (dStr === targetDateString) {
            return {
              date: day.date,
              meals: [...validMeals, newMeal],
            };
          }
          return {
            date: day.date,
            meals: validMeals,
          };
        });

        await mealPlanService.updateMealPlan(existingPlan._id, {
          days: updatedDays,
        });
      }

      const dayLabel = targetDay.dayName;
      setPlanSuccessMsg(`Added "${selectedRecipeForPlan.title}" to ${dayLabel} ${targetMealType}!`);
      setTimeout(() => {
        setSelectedRecipeForPlan(null);
        setPlanSuccessMsg('');
      }, 1800);

      if (typeof onMealAdded === 'function') {
        onMealAdded();
      }
    } catch (err) {
      console.error('Failed to add recommendation to meal plan:', err);
      setPlanErrorMsg(err.message || 'Failed to add recipe to meal plan.');
    } finally {
      setAddingToPlan(false);
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-8 shadow-xs flex flex-col items-center justify-center text-center">
        <Sparkles className="w-12 h-12 text-surface-muted mb-3 opacity-50" />
        <h4 className="text-base font-bold text-surface-text">No Recommendations Available</h4>
        <p className="text-xs text-surface-muted mt-1 max-w-sm">
          Add some pantry ingredients or select your preferred cuisines above to generate tailored recipe ideas.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-surface-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Ingredient-Based Recipe Ideas & Recommendations
          </h3>
          <p className="text-xs text-surface-muted mt-0.5">
            Rule-based suggestions ranked by pantry ingredient overlap, cuisine match, and dietary affinity
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 self-start sm:self-auto">
          {recommendations.length} Smart Picks
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((item, idx) => {
          const { recipe, matchPercentage, matchedIngredients = [], missingIngredients = [], reason } = item;
          if (!recipe) return null;

          const isHighMatch = matchPercentage >= 50;

          return (
            <div
              key={recipe._id || idx}
              className="flex flex-col justify-between p-4 rounded-xl border border-surface-border bg-surface-canvas hover:border-brand-500/40 transition-all duration-150 shadow-2xs"
            >
              <div>
                {/* Header: Title + Match Badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/recipes/${recipe._id}`}
                      className="text-sm font-bold text-surface-text hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                    >
                      {recipe.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-surface-muted">
                      <span className="inline-flex items-center gap-1">
                        <Utensils className="w-3 h-3" />
                        {recipe.cuisine}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes}m` : '20m'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`
                      shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border
                      ${
                        isHighMatch
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                      }
                    `}
                  >
                    {matchPercentage}% Match
                  </span>
                </div>

                {/* Explanation / Reason */}
                <p className="text-xs text-surface-muted bg-surface-subtle/60 p-2.5 rounded-lg border border-surface-border/50 mb-3">
                  {reason}
                </p>

                {/* Matched Ingredients Chips */}
                {matchedIngredients.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Pantry Matches ({matchedIngredients.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {matchedIngredients.slice(0, 5).map((ing, i) => (
                        <span
                          key={`match-${i}`}
                          className="px-2 py-0.5 text-[11px] rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                        >
                          {ing}
                        </span>
                      ))}
                      {matchedIngredients.length > 5 && (
                        <span className="text-[11px] text-surface-muted self-center">
                          +{matchedIngredients.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Missing Ingredients Chips */}
                {missingIngredients.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-surface-muted uppercase tracking-wider block mb-1">
                      Missing ({missingIngredients.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {missingIngredients.slice(0, 4).map((ing, i) => (
                        <span
                          key={`miss-${i}`}
                          className="px-2 py-0.5 text-[11px] rounded-md bg-surface-subtle text-surface-muted border border-surface-border"
                        >
                          {ing}
                        </span>
                      ))}
                      {missingIngredients.length > 4 && (
                        <span className="text-[11px] text-surface-muted self-center">
                          +{missingIngredients.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-surface-border mt-2">
                <Link
                  to={`/recipes/${recipe._id}`}
                  className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold text-surface-text bg-surface-subtle hover:bg-surface-border transition-colors border border-surface-border"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(recipe)}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add to Plan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Recommendation to Meal Plan Modal */}
      {selectedRecipeForPlan && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRecipeForPlan(null)}
          title={`Schedule Recipe to Meal Plan`}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs text-surface-muted">Recipe to schedule:</p>
              <h4 className="text-sm font-bold text-surface-text mt-0.5">
                {selectedRecipeForPlan.title}
              </h4>
            </div>

            {planSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{planSuccessMsg}</span>
              </div>
            )}

            {planErrorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{planErrorMsg}</span>
              </div>
            )}

            {/* Target Day */}
            <div>
              <label className="block text-xs font-bold text-surface-text uppercase tracking-wider mb-2">
                Select Day (Week of {currentMonday})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {weekDays.map((d, index) => {
                  const isSelected = targetDayIndex === index;
                  return (
                    <button
                      key={d.dateString}
                      type="button"
                      onClick={() => setTargetDayIndex(index)}
                      className={`
                        p-2 rounded-xl text-xs font-medium border text-center transition-all
                        ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-xs'
                            : 'bg-surface-canvas text-surface-text border-surface-border hover:bg-surface-subtle'
                        }
                      `}
                    >
                      <div className="font-bold">{d.dayName}</div>
                      <div className="text-[10px] opacity-80">{d.formattedDate}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Meal Type */}
            <div>
              <label className="block text-xs font-bold text-surface-text uppercase tracking-wider mb-2">
                Select Meal Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MEAL_TYPES.map((type) => {
                  const isSelected = targetMealType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTargetMealType(type)}
                      className={`
                        py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all
                        ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-xs'
                            : 'bg-surface-canvas text-surface-text border-surface-border hover:bg-surface-subtle'
                        }
                      `}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedRecipeForPlan(null)}
                disabled={addingToPlan}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAddToPlan}
                isLoading={addingToPlan}
                disabled={addingToPlan}
              >
                Confirm Add
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
