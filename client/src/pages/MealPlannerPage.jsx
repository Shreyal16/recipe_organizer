import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  DragOverlay,
  pointerWithin,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import mealPlanService from '../services/mealPlanService';
import {
  getMondayString,
  shiftWeek,
  getWeekDays,
  formatWeekRange,
} from '../utils/dateUtils';
import { moveMeal, sanitizeDaysForSubmission } from '../utils/mealPlanUtils';
import DayColumn from '../components/planner/DayColumn';
import MealCardOverlay from '../components/planner/MealCardOverlay';
import RecipeSelectorModal from '../components/planner/RecipeSelectorModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBanner from '../components/common/ErrorBanner';
import Button from '../components/common/Button';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function MealPlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected week's Monday in 'YYYY-MM-DD'
  const initialMonday = searchParams.get('week') || getMondayString();
  const [currentMonday, setCurrentMonday] = useState(initialMonday);

  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMove, setSavingMove] = useState(false);
  const [error, setError] = useState(null);
  const [moveFeedback, setMoveFeedback] = useState(null);

  // Active dragged meal for overlay
  const [activeMeal, setActiveMeal] = useState(null);

  // Recipe selector modal target: { dateString, mealType }
  const [slotTarget, setSlotTarget] = useState(null);

  const weekDays = getWeekDays(currentMonday);

  // Configure accessible dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px distance before drag activates to allow normal button clicks
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const announcements = {
    onDragStart({ active }) {
      const meal = active.data.current?.meal;
      const title = meal?.recipeId?.title || 'Meal';
      return `Picked up ${title}. Use arrow keys to navigate slots, space to drop.`;
    },
    onDragOver({ active, over }) {
      if (!over) return 'Not over a valid drop target.';
      const { dayName, mealType } = over.data.current || {};
      return `Over ${dayName || ''} ${mealType || 'slot'}.`;
    },
    onDragEnd({ active, over }) {
      const meal = active.data.current?.meal;
      const title = meal?.recipeId?.title || 'Meal';
      if (!over) return `Dropped ${title}. Movement cancelled.`;
      const { dayName, mealType } = over.data.current || {};
      return `Dropped ${title} into ${dayName || ''} ${mealType || 'slot'}.`;
    },
    onDragCancel({ active }) {
      const meal = active.data.current?.meal;
      const title = meal?.recipeId?.title || 'Meal';
      return `Dragging cancelled for ${title}.`;
    },
  };

  const fetchWeeklyPlan = useCallback(async (mondayStr) => {
    try {
      setLoading(true);
      setError(null);
      const res = await mealPlanService.getMealPlan(mondayStr);
      setMealPlan(res.data || null);
    } catch (err) {
      if (err.status === 404) {
        setMealPlan(null);
      } else {
        console.error('Failed to load meal plan:', err);
        setError(err.message || 'Failed to load weekly meal plan.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeeklyPlan(currentMonday);
    setSearchParams({ week: currentMonday }, { replace: true });
  }, [currentMonday, fetchWeeklyPlan, setSearchParams]);

  const handleWeekShift = (offset) => {
    if (savingMove || saving) return;
    const nextMonday = shiftWeek(currentMonday, offset);
    setCurrentMonday(nextMonday);
  };

  const handleJumpToCurrentWeek = () => {
    if (savingMove || saving) return;
    const thisMonday = getMondayString();
    setCurrentMonday(thisMonday);
  };

  // User clicked "+" on a slot
  const handleOpenAddMeal = (dateString, mealType) => {
    if (savingMove || saving) return;
    setSlotTarget({ dateString, mealType });
  };

  // User selected a recipe from the modal
  const handleRecipeSelected = async (recipe) => {
    if (!slotTarget) return;
    const { dateString, mealType } = slotTarget;
    setSlotTarget(null);

    const newMeal = {
      mealType,
      recipeId: recipe._id,
      servings: recipe.servings || 2,
    };

    try {
      setSaving(true);
      if (!mealPlan) {
        // Create new weekly plan
        const newDays = weekDays.map((d) => ({
          date: d.dateString,
          meals: d.dateString === dateString ? [newMeal] : [],
        }));

        const res = await mealPlanService.createMealPlan({
          weekStartDate: currentMonday,
          days: newDays,
        });
        setMealPlan(res.data);
      } else {
        // Update existing plan
        const updatedDays = (mealPlan.days || []).map((day) => {
          const dStr = new Date(day.date).toISOString().split('T')[0];
          const validExistingMeals = (day.meals || [])
            .filter((m) => m.recipeId)
            .map((m) => ({
              mealType: m.mealType,
              recipeId: typeof m.recipeId === 'object' ? m.recipeId._id : m.recipeId,
              servings: m.servings,
            }));

          if (dStr === dateString) {
            return {
              date: day.date,
              meals: [...validExistingMeals, newMeal],
            };
          }
          return {
            date: day.date,
            meals: validExistingMeals,
          };
        });

        const res = await mealPlanService.updateMealPlan(mealPlan._id, {
          days: updatedDays,
        });
        setMealPlan(res.data);
      }
    } catch (err) {
      console.error('Failed to add meal to plan:', err);
      setError(err.message || 'Failed to update meal plan.');
    } finally {
      setSaving(false);
    }
  };

  // Remove meal from slot
  const handleRemoveMeal = async (dateString, targetMeal) => {
    if (!mealPlan || saving || savingMove) return;

    const previousPlan = mealPlan;
    const targetMealId = (targetMeal._id || targetMeal.id || '').toString();

    const updatedDays = mealPlan.days.map((day) => {
      const dStr = new Date(day.date).toISOString().split('T')[0];
      if (dStr !== dateString) return day;

      return {
        ...day,
        meals: day.meals.filter((m) => {
          const mId = (m._id || m.id || '').toString();
          return mId !== targetMealId;
        }),
      };
    });

    setMealPlan({ ...mealPlan, days: updatedDays });

    try {
      setSaving(true);
      const sanitized = sanitizeDaysForSubmission(updatedDays);
      const res = await mealPlanService.updateMealPlan(mealPlan._id, {
        days: sanitized,
      });
      setMealPlan(res.data);
    } catch (err) {
      console.error('Failed to remove meal:', err);
      setMealPlan(previousPlan);
      setError(err.message || 'Failed to remove meal.');
    } finally {
      setSaving(false);
    }
  };

  // Update servings for a meal
  const handleUpdateServings = async (dateString, targetMeal, newServings) => {
    if (!mealPlan || newServings < 1 || saving || savingMove) return;

    const previousPlan = mealPlan;
    const targetMealId = (targetMeal._id || targetMeal.id || '').toString();

    const updatedDays = mealPlan.days.map((day) => {
      const dStr = new Date(day.date).toISOString().split('T')[0];
      if (dStr !== dateString) return day;

      return {
        ...day,
        meals: day.meals.map((m) => {
          const mId = (m._id || m.id || '').toString();
          if (mId === targetMealId) {
            return { ...m, servings: newServings };
          }
          return m;
        }),
      };
    });

    setMealPlan({ ...mealPlan, days: updatedDays });

    try {
      setSaving(true);
      const sanitized = sanitizeDaysForSubmission(updatedDays);
      const res = await mealPlanService.updateMealPlan(mealPlan._id, {
        days: sanitized,
      });
      setMealPlan(res.data);
    } catch (err) {
      console.error('Failed to update servings:', err);
      setMealPlan(previousPlan);
      setError(err.message || 'Failed to update servings.');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // Drag and Drop Event Handlers
  // -------------------------------------------------------------
  const handleDragStart = (event) => {
    if (savingMove || saving) return;
    const meal = event.active.data.current?.meal;
    setActiveMeal(meal || null);
    setMoveFeedback(null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveMeal(null);

    if (!over || !mealPlan) return;

    // over.id format: `${dayDate}::${mealType}`
    const droppableId = String(over.id);
    if (!droppableId.includes('::')) return;

    const [targetDateStr, targetMealType] = droppableId.split('::');
    const activeMealId = String(active.id);

    // Call pure movement utility
    const result = moveMeal(mealPlan.days, activeMealId, targetDateStr, targetMealType);

    // Null means invalid target or dropped onto same original slot (no-op)
    if (!result) return;

    const { updatedDays, movedMeal } = result;
    const previousPlan = mealPlan;

    // 1. Optimistic UI update
    setMealPlan({
      ...mealPlan,
      days: updatedDays,
    });
    setSavingMove(true);
    setError(null);
    setMoveFeedback({
      type: 'info',
      message: `Moving "${movedMeal?.recipeId?.title || 'Meal'}" to ${targetMealType}...`,
    });

    try {
      // 2. Prepare clean payload stripping any stale references
      const sanitizedDays = sanitizeDaysForSubmission(updatedDays);

      let res;
      if (mealPlan._id) {
        res = await mealPlanService.updateMealPlan(mealPlan._id, {
          days: sanitizedDays,
        });
      } else {
        res = await mealPlanService.createMealPlan({
          weekStartDate: currentMonday,
          days: sanitizedDays,
        });
      }

      // 3. Update with fresh server populated plan
      setMealPlan(res.data);
      setMoveFeedback({
        type: 'success',
        message: `Saved! Moved to ${targetMealType}.`,
      });
      setTimeout(() => setMoveFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to save meal movement:', err);
      // 4. Rollback to previous state on failure
      setMealPlan(previousPlan);
      setMoveFeedback(null);
      setError(`Failed to save meal move: ${err.message || 'Server error'}. Schedule restored.`);
    } finally {
      setSavingMove(false);
    }
  };

  const handleDragCancel = () => {
    setActiveMeal(null);
  };

  const isInteractingDisabled = saving || savingMove;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{ announcements }}
    >
      <div className="space-y-6 overflow-x-hidden">
        {/* Top Header & Grocery Shortcut */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-text tracking-tight">
              Weekly Meal Planner
            </h1>
            <p className="text-sm text-surface-muted mt-1">
              Plan your week, drag and drop meals between days and slots, or generate a tailored grocery list.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              icon={ShoppingCart}
              onClick={() => navigate(`/grocery-list?week=${currentMonday}`)}
            >
              View Grocery List
            </Button>
          </div>
        </div>

        {/* Week Navigation Toolbar */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              onClick={() => handleWeekShift(-1)}
              disabled={isInteractingDisabled}
            >
              Prev Week
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={handleJumpToCurrentWeek}
              disabled={isInteractingDisabled}
              className="text-xs font-semibold text-surface-text"
            >
              Current Week
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={ChevronRight}
              iconPosition="right"
              onClick={() => handleWeekShift(1)}
              disabled={isInteractingDisabled}
            >
              Next Week
            </Button>
          </div>

          {/* Formatted Date Range */}
          <div className="flex items-center gap-2 text-sm font-bold text-surface-text">
            <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>{formatWeekRange(currentMonday)}</span>
          </div>

          {/* Live Status Indicators */}
          <div className="flex items-center gap-2 text-xs">
            {savingMove && (
              <span className="text-brand-600 dark:text-brand-400 font-semibold animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                Persisting move...
              </span>
            )}
            {saving && !savingMove && (
              <span className="text-brand-600 dark:text-brand-400 font-semibold animate-pulse">
                Saving schedule changes...
              </span>
            )}
            {moveFeedback && moveFeedback.type === 'success' && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {moveFeedback.message}
              </span>
            )}
          </div>
        </div>

        {error && <ErrorBanner message={error} onRetry={() => fetchWeeklyPlan(currentMonday)} />}

        {/* 7-Day Planner Columns */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <LoadingSpinner size="lg" text="Loading your weekly schedule..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5 items-start">
            {weekDays.map((dayInfo) => {
              const dayData = (mealPlan?.days || []).find(
                (d) => new Date(d.date).toISOString().split('T')[0] === dayInfo.dateString
              );

              return (
                <DayColumn
                  key={dayInfo.dateString}
                  dayInfo={dayInfo}
                  dayData={dayData}
                  onAddMealToSlot={handleOpenAddMeal}
                  onRemoveMealFromSlot={handleRemoveMeal}
                  onUpdateServingsInSlot={handleUpdateServings}
                  disabled={isInteractingDisabled}
                />
              );
            })}
          </div>
        )}

        {/* Drag Overlay Preview */}
        <DragOverlay>
          {activeMeal ? <MealCardOverlay meal={activeMeal} /> : null}
        </DragOverlay>

        {/* Recipe Selector Modal */}
        <RecipeSelectorModal
          isOpen={Boolean(slotTarget)}
          onClose={() => setSlotTarget(null)}
          title={
            slotTarget
              ? `Choose a Recipe for ${slotTarget.mealType} on ${slotTarget.dateString}`
              : 'Select Recipe'
          }
          onSelectRecipe={handleRecipeSelected}
        />
      </div>
    </DndContext>
  );
}
