import recipeService from '../services/recipeService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getRecipes = asyncHandler(async (req, res) => {
  const result = await recipeService.searchRecipes(req.query);
  return sendSuccess(res, result.recipes, result.meta, 200);
});

export const getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await recipeService.getRecipeById(req.params.id);
  if (!recipe) {
    return sendError(res, `Recipe not found with ID ${req.params.id}`, 404);
  }
  return sendSuccess(res, recipe, null, 200);
});

export const createRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeService.createRecipe(req.body);
  return sendSuccess(res, recipe, null, 201);
});

export const updateRecipe = asyncHandler(async (req, res) => {
  const updated = await recipeService.updateRecipe(req.params.id, req.body);
  if (!updated) {
    return sendError(res, `Recipe not found with ID ${req.params.id}`, 404);
  }
  return sendSuccess(res, updated, null, 200);
});

export const deleteRecipe = asyncHandler(async (req, res) => {
  const deleted = await recipeService.deleteRecipe(req.params.id);
  if (!deleted) {
    return sendError(res, `Recipe not found with ID ${req.params.id}`, 404);
  }
  return sendSuccess(res, { message: 'Recipe deleted successfully', deletedId: req.params.id }, null, 200);
});

export default {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
