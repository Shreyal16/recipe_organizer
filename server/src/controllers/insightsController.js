import insightsService from '../services/insightsService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getInsights = asyncHandler(async (req, res) => {
  const insights = await insightsService.calculateInsights();
  return sendSuccess(res, insights, null, 200);
});

export default {
  getInsights,
};
