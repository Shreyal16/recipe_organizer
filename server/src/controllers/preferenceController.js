import preferenceService from '../services/preferenceService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await preferenceService.getPreferences();
  return sendSuccess(res, preferences, null, 200);
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const updated = await preferenceService.updatePreferences(req.body);
  return sendSuccess(res, updated, null, 200);
});

export default {
  getPreferences,
  updatePreferences,
};
