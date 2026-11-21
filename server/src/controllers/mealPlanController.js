import mealPlanService from '../services/mealPlanService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getMealPlanByWeek = asyncHandler(async (req, res) => {
  const plan = await mealPlanService.getMealPlanByWeek(req.params.weekStart);
  return sendSuccess(res, plan, null, 200);
});

export const createMealPlan = asyncHandler(async (req, res) => {
  const plan = await mealPlanService.createMealPlan(req.body);
  return sendSuccess(res, plan, null, 201);
});

export const updateMealPlan = asyncHandler(async (req, res) => {
  const updated = await mealPlanService.updateMealPlan(req.params.id, req.body);
  return sendSuccess(res, updated, null, 200);
});

export const deleteMealPlan = asyncHandler(async (req, res) => {
  await mealPlanService.deleteMealPlan(req.params.id);
  return sendSuccess(res, { message: 'Meal plan deleted successfully', deletedId: req.params.id }, null, 200);
});

export default {
  getMealPlanByWeek,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
};
