import MealPlan from '../models/MealPlan.js';
import Recipe from '../models/Recipe.js';
import { getMondayUTC, getWeekDatesUTC } from '../utils/dateUtils.js';

/**
 * Validates that all recipe references in the meal plan actually exist in the database.
 */
const validateRecipeReferences = async (days = []) => {
  const recipeIds = new Set();
  for (const day of days) {
    if (Array.isArray(day.meals)) {
      for (const meal of day.meals) {
        if (meal.recipeId) {
          recipeIds.add(meal.recipeId.toString());
        }
      }
    }
  }

  if (recipeIds.size > 0) {
    const count = await Recipe.countDocuments({ _id: { $in: Array.from(recipeIds) } });
    if (count !== recipeIds.size) {
      const err = new Error('One or more referenced recipes in the meal plan do not exist');
      err.statusCode = 400;
      throw err;
    }
  }
};

/**
 * Initializes empty 7 days (Monday to Sunday) if not provided.
 */
const ensureSevenDays = (mondayDate, days = []) => {
  const weekDates = getWeekDatesUTC(mondayDate);
  const resultDays = [];

  for (let i = 0; i < 7; i++) {
    const expectedDate = weekDates[i];
    const existingDay = days.find(
      (d) => new Date(d.date).toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]
    );

    resultDays.push({
      date: expectedDate,
      meals: existingDay ? existingDay.meals : [],
    });
  }

  return resultDays;
};

const populatePlanRecipes = async (plan) => {
  if (!plan) return null;
  const recipeIds = [];
  for (const day of plan.days || []) {
    for (const meal of day.meals || []) {
      if (meal.recipeId) recipeIds.push(meal.recipeId);
    }
  }

  const recipes = await Recipe.find({ _id: { $in: recipeIds } }).lean();
  const recipeMap = new Map(recipes.map((r) => [r._id.toString(), r]));

  for (const day of plan.days || []) {
    for (const meal of day.meals || []) {
      const rawId = meal.recipeId ? meal.recipeId.toString() : '';
      meal.rawRecipeId = rawId;
      meal.recipeId = recipeMap.get(rawId) || null;
    }
  }
  return plan;
};

export const getMealPlanByWeek = async (weekStartInput) => {
  const monday = getMondayUTC(weekStartInput);
  const plan = await MealPlan.findOne({ weekStartDate: monday }).lean();
  return await populatePlanRecipes(plan);
};

export const createMealPlan = async (data) => {
  const monday = getMondayUTC(data.weekStartDate);

  // Check for duplicate weekly plan
  const existing = await MealPlan.findOne({ weekStartDate: monday });
  if (existing) {
    const err = new Error(`A meal plan already exists for the week starting ${monday.toISOString().split('T')[0]}`);
    err.statusCode = 409;
    throw err;
  }

  await validateRecipeReferences(data.days);

  const formattedDays = ensureSevenDays(monday, data.days);

  const mealPlan = new MealPlan({
    weekStartDate: monday,
    days: formattedDays,
  });

  await mealPlan.save();
  const leanPlan = await MealPlan.findById(mealPlan._id).lean();
  return await populatePlanRecipes(leanPlan);
};

export const updateMealPlan = async (id, data) => {
  const existing = await MealPlan.findById(id);
  if (!existing) {
    const err = new Error(`Meal plan not found with ID ${id}`);
    err.statusCode = 404;
    throw err;
  }

  let monday = existing.weekStartDate;
  if (data.weekStartDate) {
    monday = getMondayUTC(data.weekStartDate);
    // If date changed, verify no other document has that weekStartDate
    const conflict = await MealPlan.findOne({ weekStartDate: monday, _id: { $ne: id } });
    if (conflict) {
      const err = new Error(`Another meal plan already exists for the week of ${monday.toISOString().split('T')[0]}`);
      err.statusCode = 409;
      throw err;
    }
  }

  if (data.days) {
    await validateRecipeReferences(data.days);
  }

  const updatedDays = data.days ? ensureSevenDays(monday, data.days) : existing.days;

  existing.weekStartDate = monday;
  existing.days = updatedDays;

  await existing.save();
  const leanPlan = await MealPlan.findById(existing._id).lean();
  return await populatePlanRecipes(leanPlan);
};

export const deleteMealPlan = async (id) => {
  const deleted = await MealPlan.findByIdAndDelete(id).lean();
  if (!deleted) {
    const err = new Error(`Meal plan not found with ID ${id}`);
    err.statusCode = 404;
    throw err;
  }
  return deleted;
};

export default {
  getMealPlanByWeek,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
};
