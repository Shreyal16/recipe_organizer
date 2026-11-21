import Favorite from '../models/Favorite.js';
import Recipe from '../models/Recipe.js';

export const listFavorites = async () => {
  const favorites = await Favorite.find().sort({ createdAt: -1 }).lean();
  const recipeIds = favorites.map((f) => f.recipeId).filter(Boolean);
  const recipes = await Recipe.find({ _id: { $in: recipeIds } }).lean();
  const recipeMap = new Map(recipes.map((r) => [r._id.toString(), r]));

  return favorites.map((f) => {
    const rawId = f.recipeId ? f.recipeId.toString() : '';
    const populated = recipeMap.get(rawId) || null;
    return {
      _id: f._id,
      rawRecipeId: rawId,
      recipeId: populated,
      createdAt: f.createdAt,
    };
  });
};

export const addFavorite = async (recipeId) => {
  // Validate that referenced recipe exists
  const recipeExists = await Recipe.findById(recipeId);
  if (!recipeExists) {
    const err = new Error(`Recipe not found with ID ${recipeId}`);
    err.statusCode = 404;
    throw err;
  }

  // Check if already favorited
  const existing = await Favorite.findOne({ recipeId });
  if (existing) {
    const err = new Error('Recipe is already in favorites');
    err.statusCode = 409;
    throw err;
  }

  const favorite = new Favorite({ recipeId });
  await favorite.save();
  const populated = await Recipe.findById(recipeId).lean();
  return {
    _id: favorite._id,
    rawRecipeId: recipeId.toString(),
    recipeId: populated,
    createdAt: favorite.createdAt,
  };
};

export const removeFavorite = async (recipeId) => {
  const deleted = await Favorite.findOneAndDelete({ recipeId }).lean();
  if (!deleted) {
    const err = new Error('Favorite entry not found for this recipe');
    err.statusCode = 404;
    throw err;
  }
  return deleted;
};

export default {
  listFavorites,
  addFavorite,
  removeFavorite,
};
