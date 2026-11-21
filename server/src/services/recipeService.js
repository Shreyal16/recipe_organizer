import mongoose from 'mongoose';
import Recipe from '../models/Recipe.js';
import Favorite from '../models/Favorite.js';
import MealPlan from '../models/MealPlan.js';
import { escapeRegex } from '../utils/sanitize.js';

/**
 * Searches and paginates recipes with filtering and sorting.
 */
export const searchRecipes = async (queryParams) => {
  const {
    q,
    ingredients,
    ingredientMatch = 'any',
    cuisine,
    mealType,
    maxPrepTime,
    dietaryTags,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  // Title search (q)
  if (q && q.trim()) {
    const escaped = escapeRegex(q.trim());
    filter.title = { $regex: escaped, $options: 'i' };
  }

  // Cuisine filter
  if (cuisine && cuisine.trim()) {
    filter.cuisine = { $regex: `^${escapeRegex(cuisine.trim())}$`, $options: 'i' };
  }

  // Meal type filter
  if (mealType && mealType.trim()) {
    filter.mealType = { $regex: `^${escapeRegex(mealType.trim())}$`, $options: 'i' };
  }

  // Max prep time filter
  if (maxPrepTime !== undefined && maxPrepTime !== null && maxPrepTime !== '') {
    const maxTime = parseInt(maxPrepTime, 10);
    if (!isNaN(maxTime) && maxTime >= 0) {
      filter.prepTimeMinutes = { $lte: maxTime };
    }
  }

  // Dietary tags filter (ANY matching by default)
  if (dietaryTags && dietaryTags.trim()) {
    const tags = dietaryTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => new RegExp(`^${escapeRegex(t)}$`, 'i'));
    if (tags.length > 0) {
      filter.dietaryTags = { $in: tags };
    }
  }

  // Ingredients search (ANY or ALL matching)
  if (ingredients && ingredients.trim()) {
    const ingList = ingredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    if (ingList.length > 0) {
      const regexConditions = ingList.map((ing) => ({
        'ingredients.name': { $regex: escapeRegex(ing), $options: 'i' },
      }));

      if (ingredientMatch === 'all') {
        filter.$and = filter.$and ? [...filter.$and, ...regexConditions] : regexConditions;
      } else {
        // default: any
        filter.$or = regexConditions;
      }
    }
  }

  // Sort logic
  if (sort === 'popularity') {
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'favorites',
          localField: '_id',
          foreignField: 'recipeId',
          as: 'favoriteEntries',
        },
      },
      {
        $addFields: {
          favoriteCount: { $size: '$favoriteEntries' },
        },
      },
      {
        $project: {
          favoriteEntries: 0,
        },
      },
      {
        $sort: {
          favoriteCount: -1,
          createdAt: -1,
          _id: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limitNum }],
        },
      },
    ];

    const [result] = await Recipe.aggregate(pipeline);
    const total = result.metadata[0] ? result.metadata[0].total : 0;
    const recipes = result.data;

    return {
      recipes,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  let sortObj = { createdAt: -1, _id: -1 }; // default newest
  if (sort === 'prepTime') {
    sortObj = { prepTimeMinutes: 1, _id: 1 };
  } else if (sort === 'title') {
    sortObj = { title: 1, _id: 1 };
  } else if (sort === 'newest') {
    sortObj = { createdAt: -1, _id: -1 };
  }

  const [recipes, total] = await Promise.all([
    Recipe.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
    Recipe.countDocuments(filter),
  ]);

  return {
    recipes,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const getRecipeById = async (id) => {
  return await Recipe.findById(id).lean();
};

export const createRecipe = async (recipeData) => {
  const recipe = new Recipe(recipeData);
  return await recipe.save();
};

export const updateRecipe = async (id, updateData) => {
  return await Recipe.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean();
};

/**
 * Deletes a recipe and cleans up dependent references:
 * 1. Removes associated Favorite documents.
 * 2. Removes only meal entries referencing this recipe from all MealPlan documents.
 * 3. Uses a MongoDB transaction when supported (replica set).
 * 4. Falls back to safe, idempotent cleanup-first, delete-last when standalone.
 * If any cleanup operation fails, the recipe is not deleted or reported as deleted.
 */
export const deleteRecipe = async (id) => {
  const recipe = await Recipe.findById(id);
  if (!recipe) {
    return null;
  }

  let session = null;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    session = null;
  }

  if (session) {
    let deleted = null;
    let transactionSucceeded = false;
    try {
      await session.withTransaction(async () => {
        // 1. Delete associated Favorite documents
        await Favorite.deleteMany({ recipeId: id }, { session });

        // 2. Remove only meal entries referencing that recipe from all MealPlan documents
        await MealPlan.updateMany(
          { 'days.meals.recipeId': id },
          { $pull: { 'days.$[].meals': { recipeId: id } } },
          { session }
        );

        // 3. Delete the recipe document
        deleted = await Recipe.findByIdAndDelete(id, { session }).lean();
      });
      transactionSucceeded = true;
    } catch (err) {
      const isStandaloneError =
        err.message?.includes('Transaction numbers are only allowed on a replica set') ||
        err.message?.includes('replica set member or mongos') ||
        err.message?.includes('This MongoDB deployment does not support retryable writes');

      if (!isStandaloneError) {
        console.error(`[Delete Recipe Transaction Error] Cleanup failed for recipe ${id}:`, err.message);
        throw err;
      }
      // If standalone error, continue to fallback path below
    } finally {
      await session.endSession();
    }

    if (transactionSucceeded) {
      return deleted;
    }
  }

  // Standalone fallback path:
  // Perform idempotent dependent-reference cleanup first, delete recipe LAST.
  // If any cleanup fails, do not delete the recipe or report success.
  try {
    await Favorite.deleteMany({ recipeId: id });

    await MealPlan.updateMany(
      { 'days.meals.recipeId': id },
      { $pull: { 'days.$[].meals': { recipeId: id } } }
    );

    const deleted = await Recipe.findByIdAndDelete(id).lean();
    return deleted;
  } catch (err) {
    console.error(`[Delete Recipe Fallback Error] Cleanup failed for recipe ${id}:`, err.message);
    throw err;
  }
};

export default {
  searchRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
