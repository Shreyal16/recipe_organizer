import { describe, it, expect } from 'vitest';
import { moveMeal, sanitizeDaysForSubmission } from '../utils/mealPlanUtils';

describe('Meal Plan Movement & Sanitization Utilities', () => {
  const initialDays = [
    {
      date: '2026-11-23T00:00:00.000Z',
      meals: [
        { _id: 'meal-1', mealType: 'Breakfast', recipeId: 'rec-1', servings: 2 },
        { _id: 'meal-2', mealType: 'Lunch', recipeId: 'rec-2', servings: 4 },
      ],
    },
    {
      date: '2026-11-24T00:00:00.000Z',
      meals: [
        { _id: 'meal-3', mealType: 'Dinner', recipeId: 'rec-3', servings: 1 },
      ],
    },
    {
      date: '2026-11-25T00:00:00.000Z',
      meals: [],
    },
  ];

  it('moves a meal to another day and meal type, appending to the target slot', () => {
    const result = moveMeal(initialDays, 'meal-1', '2026-11-24', 'Dinner');
    expect(result).not.toBeNull();
    const { updatedDays, movedMeal } = result;

    // Day 0 (Nov 23): meal-1 removed, meal-2 remains intact
    expect(updatedDays[0].meals.length).toBe(1);
    expect(updatedDays[0].meals[0]._id).toBe('meal-2');

    // Day 1 (Nov 24): meal-3 remains at index 0, meal-1 appended at index 1
    expect(updatedDays[1].meals.length).toBe(2);
    expect(updatedDays[1].meals[0]._id).toBe('meal-3');
    expect(updatedDays[1].meals[1]._id).toBe('meal-1');
    expect(updatedDays[1].meals[1].mealType).toBe('Dinner');
    expect(updatedDays[1].meals[1].recipeId).toBe('rec-1');
    expect(updatedDays[1].meals[1].servings).toBe(2);

    // Day 2 remains untouched
    expect(updatedDays[2].meals.length).toBe(0);
  });

  it('returns null (no-op) when dropped onto the same slot', () => {
    const result = moveMeal(initialDays, 'meal-1', '2026-11-23', 'Breakfast');
    expect(result).toBeNull();
  });

  it('moves a meal within the same day to a different mealType', () => {
    const result = moveMeal(initialDays, 'meal-1', '2026-11-23', 'Dinner');
    expect(result).not.toBeNull();
    const { updatedDays } = result;

    expect(updatedDays[0].meals.length).toBe(2);
    expect(updatedDays[0].meals[0]._id).toBe('meal-2');
    expect(updatedDays[0].meals[1]._id).toBe('meal-1');
    expect(updatedDays[0].meals[1].mealType).toBe('Dinner');
  });

  it('preserves all unrelated meals and their order', () => {
    const result = moveMeal(initialDays, 'meal-2', '2026-11-25', 'Breakfast');
    expect(result).not.toBeNull();
    const { updatedDays } = result;

    // Day 0: meal-1 remains
    expect(updatedDays[0].meals[0]._id).toBe('meal-1');
    // Day 1: meal-3 remains in exact original order
    expect(updatedDays[1].meals[0]._id).toBe('meal-3');
    // Day 2: meal-2 is now there
    expect(updatedDays[2].meals[0]._id).toBe('meal-2');
  });

  it('sanitizes days by stripping stale/null recipe references and extracting string IDs', () => {
    const dirtyDays = [
      {
        date: '2026-11-23T00:00:00.000Z',
        meals: [
          // Valid populated recipe object
          { mealType: 'Breakfast', recipeId: { _id: 'rec-1', title: 'Pancakes' }, servings: 2 },
          // Valid string ID
          { mealType: 'Lunch', recipeId: 'rec-2', servings: 3 },
          // Stale/deleted recipe reference (null)
          { mealType: 'Dinner', recipeId: null, servings: 1 },
          // Stale populated recipe with null _id
          { mealType: 'Snack', recipeId: { title: 'Dangling' }, servings: 1 },
        ],
      },
    ];

    const sanitized = sanitizeDaysForSubmission(dirtyDays);
    expect(sanitized[0].meals.length).toBe(2);
    expect(sanitized[0].meals[0]).toEqual({
      mealType: 'Breakfast',
      recipeId: 'rec-1',
      servings: 2,
    });
    expect(sanitized[0].meals[1]).toEqual({
      mealType: 'Lunch',
      recipeId: 'rec-2',
      servings: 3,
    });
  });
});
