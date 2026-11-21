/**
 * Pure utility functions for meal plan data manipulation and drag-and-drop movements.
 */

/**
 * Normalizes any Date, ISO string, or YYYY-MM-DD to 'YYYY-MM-DD'.
 */
export const toDateString = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && dateVal.length === 10) return dateVal;
  try {
    return new Date(dateVal).toISOString().split('T')[0];
  } catch {
    return String(dateVal);
  }
};

/**
 * Moves a meal to another day and meal type in a pure, immutable manner.
 *
 * Rules:
 * 1. Append moved meal to the end of the target slot.
 * 2. Dropping a meal onto its own original slot returns null (no-op).
 * 3. Preserve original recipeId, servings, and other metadata.
 * 4. Preserve all unrelated meals and their order.
 * 5. Remove the meal from its original slot.
 *
 * @param {Array} days - The current days array of the meal plan
 * @param {string} mealId - Unique identifier of the meal being moved
 * @param {string} targetDate - Target date string ('YYYY-MM-DD' or ISO)
 * @param {string} targetMealType - 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
 * @returns {{ updatedDays: Array, movedMeal: Object } | null}
 */
export const moveMeal = (days = [], mealId, targetDate, targetMealType) => {
  if (!days || !mealId || !targetDate || !targetMealType) return null;

  const targetDateStr = toDateString(targetDate);

  // 1. Find the meal and its current location
  let foundMeal = null;
  let sourceDayIndex = -1;
  let sourceMealIndex = -1;

  for (let d = 0; d < days.length; d++) {
    const day = days[d];
    if (!Array.isArray(day.meals)) continue;

    for (let m = 0; m < day.meals.length; m++) {
      const meal = day.meals[m];
      const id = (meal._id || meal.id || '').toString();
      if (id === mealId.toString()) {
        foundMeal = meal;
        sourceDayIndex = d;
        sourceMealIndex = m;
        break;
      }
    }
    if (foundMeal) break;
  }

  if (!foundMeal || sourceDayIndex === -1) {
    return null; // Meal not found in plan
  }

  const sourceDay = days[sourceDayIndex];
  const sourceDateStr = toDateString(sourceDay.date);
  const sourceMealType = foundMeal.mealType;

  // 2. If dropped on its own original slot, it is a no-op
  if (sourceDateStr === targetDateStr && sourceMealType === targetMealType) {
    return null;
  }

  // 3. Clone the days array immutably
  const updatedDays = days.map((day, dIdx) => {
    const curDateStr = toDateString(day.date);

    // If this is the source day, filter out the moved meal
    if (dIdx === sourceDayIndex) {
      const remainingMeals = (day.meals || []).filter(
        (_, mIdx) => mIdx !== sourceMealIndex
      );

      // If source and target are the same day (just changing mealType)
      if (curDateStr === targetDateStr) {
        const updatedMeal = {
          ...foundMeal,
          mealType: targetMealType,
        };
        return {
          ...day,
          meals: [...remainingMeals, updatedMeal],
        };
      }

      return {
        ...day,
        meals: remainingMeals,
      };
    }

    // If this is the target day (different from source day)
    if (curDateStr === targetDateStr) {
      const updatedMeal = {
        ...foundMeal,
        mealType: targetMealType,
      };
      return {
        ...day,
        meals: [...(day.meals || []), updatedMeal],
      };
    }

    // Unrelated day: return unmodified clone
    return {
      ...day,
      meals: [...(day.meals || [])],
    };
  });

  return {
    updatedDays,
    movedMeal: {
      ...foundMeal,
      mealType: targetMealType,
    },
  };
};

/**
 * Strips stale or missing recipe references and extracts raw recipeId strings for backend validation.
 *
 * @param {Array} days - The days array to sanitize
 * @returns {Array} Sanitized days array safe for POST/PUT submission
 */
export const sanitizeDaysForSubmission = (days = []) => {
  return days.map((day) => {
    const validMeals = (day.meals || [])
      .filter((meal) => {
        // Must have a valid recipe reference
        if (!meal.recipeId) return false;
        if (typeof meal.recipeId === 'object') {
          return Boolean(meal.recipeId._id);
        }
        return typeof meal.recipeId === 'string' && meal.recipeId.trim().length > 0;
      })
      .map((meal) => {
        const rawId =
          typeof meal.recipeId === 'object'
            ? meal.recipeId._id.toString()
            : meal.recipeId.toString();

        return {
          mealType: meal.mealType,
          recipeId: rawId,
          servings: Number(meal.servings) > 0 ? Number(meal.servings) : 1,
        };
      });

    return {
      date: day.date,
      meals: validMeals,
    };
  });
};
