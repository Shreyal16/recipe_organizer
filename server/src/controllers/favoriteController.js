import favoriteService from '../services/favoriteService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getFavorites = asyncHandler(async (req, res) => {
  const favorites = await favoriteService.listFavorites();
  return sendSuccess(res, favorites, null, 200);
});

export const addFavorite = asyncHandler(async (req, res) => {
  const favorite = await favoriteService.addFavorite(req.body.recipeId);
  return sendSuccess(res, favorite, null, 201);
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await favoriteService.removeFavorite(req.params.recipeId);
  return sendSuccess(res, { message: 'Recipe removed from favorites successfully', recipeId: req.params.recipeId }, null, 200);
});

export default {
  getFavorites,
  addFavorite,
  removeFavorite,
};
