import groceryListService from '../services/groceryListService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getGroceryListByWeek = asyncHandler(async (req, res) => {
  const list = await groceryListService.getGroceryListByWeek(req.params.weekStart);
  return sendSuccess(res, list, null, 200);
});

export const generateGroceryList = asyncHandler(async (req, res) => {
  const list = await groceryListService.generateGroceryList(req.body.weekStartDate);
  return sendSuccess(res, list, null, 201);
});

export const updateGroceryList = asyncHandler(async (req, res) => {
  const list = await groceryListService.updateGroceryList(req.params.id, req.body);
  return sendSuccess(res, list, null, 200);
});

export const addGroceryItem = asyncHandler(async (req, res) => {
  const list = await groceryListService.addGroceryItem(req.params.id, req.body);
  return sendSuccess(res, list, null, 201);
});

export const patchGroceryItem = asyncHandler(async (req, res) => {
  const list = await groceryListService.updateGroceryItemStatus(req.params.id, req.params.itemId, req.body);
  return sendSuccess(res, list, null, 200);
});

export const deleteGroceryItem = asyncHandler(async (req, res) => {
  const list = await groceryListService.deleteGroceryItem(req.params.id, req.params.itemId);
  return sendSuccess(res, list, null, 200);
});

export default {
  getGroceryListByWeek,
  generateGroceryList,
  updateGroceryList,
  addGroceryItem,
  patchGroceryItem,
  deleteGroceryItem,
};
