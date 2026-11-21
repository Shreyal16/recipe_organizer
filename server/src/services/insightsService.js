import Recipe from '../models/Recipe.js';
import Favorite from '../models/Favorite.js';
import MealPlan from '../models/MealPlan.js';
import UserPreference from '../models/UserPreference.js';
import { getPreferences } from './preferenceService.js';

/**
 * Calculates rule-based insights and recommendations based on real MongoDB data.
 */
export const calculateInsights = async () => {
  const preferences = await getPreferences();
  const pantrySet = new Set((preferences.pantryIngredients || []).map((p) => p.trim().toLowerCase()));
  const preferredCuisinesSet = new Set((preferences.preferredCuisines || []).map((c) => c.trim().toLowerCase()));
  const dietaryPreferencesSet = new Set((preferences.dietaryPreferences || []).map((d) => d.trim().toLowerCase()));

  // 1. Frequently saved recipes (with favorite count)
  const frequentlySavedAgg = await Favorite.aggregate([
    {
      $group: {
        _id: '$recipeId',
        savedCount: { $sum: 1 },
      },
    },
    { $sort: { savedCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'recipes',
        localField: '_id',
        foreignField: '_id',
        as: 'recipe',
      },
    },
    { $unwind: '$recipe' },
    {
      $project: {
        _id: '$recipe._id',
        title: '$recipe._id' ? '$recipe.title' : 'Unknown',
        cuisine: '$recipe.cuisine',
        imageUrl: '$recipe.imageUrl',
        prepTimeMinutes: '$recipe.prepTimeMinutes',
        savedCount: 1,
      },
    },
  ]);

  // 2. Preferred cuisines distribution (from saved favorites & preferences)
  const cuisineAggregation = await Recipe.aggregate([
    {
      $group: {
        _id: '$cuisine',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 6 },
    {
      $project: {
        cuisine: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ]);

  // 3. Common ingredients (top 10 ingredients across all recipes)
  const commonIngredientsAgg = await Recipe.aggregate([
    { $unwind: '$ingredients' },
    {
      $group: {
        _id: { $toLower: { $trim: { input: '$ingredients.name' } } },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        ingredient: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ]);

  // 4. Popular meal types (from meal plans and recipe database)
  const mealTypeAgg = await Recipe.aggregate([
    {
      $group: {
        _id: '$mealType',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        mealType: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ]);

  // 5. Rule-based recommendations based on pantry ingredients, cuisines, and dietary tags
  const allRecipes = await Recipe.find().limit(50).lean();
  const scoredRecommendations = [];

  for (const recipe of allRecipes) {
    const recipeIngredients = recipe.ingredients || [];
    if (recipeIngredients.length === 0) continue;

    const matchedIngredients = [];
    const missingIngredients = [];

    for (const ing of recipeIngredients) {
      const ingNameLower = (ing.name || '').trim().toLowerCase();
      // Check if pantry contains any word of the ingredient name or exact match
      const isMatched = Array.from(pantrySet).some(
        (pantryItem) => ingNameLower.includes(pantryItem) || pantryItem.includes(ingNameLower)
      );

      if (isMatched) {
        matchedIngredients.push(ing.name);
      } else {
        missingIngredients.push(ing.name);
      }
    }

    const baseMatchRatio = matchedIngredients.length / recipeIngredients.length;
    let matchScore = Math.round(baseMatchRatio * 100);

    // Boost score if cuisine is among preferred cuisines
    const isPreferredCuisine = preferredCuisinesSet.has((recipe.cuisine || '').toLowerCase());
    if (isPreferredCuisine) {
      matchScore = Math.min(100, matchScore + 10);
    }

    // Boost score if dietary tag aligns
    const hasDietaryMatch = (recipe.dietaryTags || []).some((tag) =>
      dietaryPreferencesSet.has(tag.toLowerCase())
    );
    if (hasDietaryMatch) {
      matchScore = Math.min(100, matchScore + 5);
    }

    let reason = 'Recommended based on overall pantry overlap.';
    if (matchedIngredients.length > 0 && isPreferredCuisine) {
      reason = `Matches ${matchedIngredients.length} pantry ingredient(s) and aligns with your ${recipe.cuisine} preference.`;
    } else if (matchedIngredients.length > 0) {
      reason = `Matches ${matchedIngredients.length} of your current pantry ingredients.`;
    } else if (isPreferredCuisine) {
      reason = `Featured in your preferred ${recipe.cuisine} cuisine collection.`;
    }

    scoredRecommendations.push({
      recipe,
      matchPercentage: matchScore,
      matchedIngredients,
      missingIngredients,
      reason,
    });
  }

  // Sort by match percentage descending and take top 6
  scoredRecommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);
  const recommendations = scoredRecommendations.slice(0, 6);

  return {
    preferredCuisines: cuisineAggregation,
    frequentlySavedRecipes: frequentlySavedAgg,
    commonIngredients: commonIngredientsAgg,
    popularMealTypes: mealTypeAgg,
    recommendations,
  };
};

export default {
  calculateInsights,
};
