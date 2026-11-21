import mongoose from 'mongoose';
import GroceryList from '../models/GroceryList.js';
import MealPlan from '../models/MealPlan.js';
import { getMondayUTC } from '../utils/dateUtils.js';
import { aggregateIngredients, categorizeIngredient, normalizeUnit } from '../utils/ingredientAggregator.js';

export const getGroceryListByWeek = async (weekStartInput) => {
  const monday = getMondayUTC(weekStartInput);
  const list = await GroceryList.findOne({ weekStartDate: monday }).lean();
  return list;
};

export const generateGroceryList = async (weekStartDateInput) => {
  const monday = getMondayUTC(weekStartDateInput);

  // 1. Fetch meal plan for that week
  const mealPlan = await MealPlan.findOne({ weekStartDate: monday }).populate('days.meals.recipeId');

  if (!mealPlan) {
    const err = new Error(`No meal plan found for the week starting ${monday.toISOString().split('T')[0]}`);
    err.statusCode = 404;
    throw err;
  }

  // 2. Extract and scale ingredients from scheduled meals
  const allIngredients = [];

  for (const day of mealPlan.days || []) {
    for (const meal of day.meals || []) {
      const recipe = meal.recipeId;
      if (!recipe || !Array.isArray(recipe.ingredients)) continue;

      const baseServings = recipe.servings && recipe.servings > 0 ? recipe.servings : 1;
      const plannedServings = meal.servings && meal.servings > 0 ? meal.servings : baseServings;
      const multiplier = plannedServings / baseServings;

      for (const ing of recipe.ingredients) {
        allIngredients.push({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          servingsMultiplier: multiplier,
        });
      }
    }
  }

  // 3. Aggregate ingredients deterministically
  const aggregatedItems = aggregateIngredients(allIngredients);

  // 4. Upsert grocery list document for that week
  let groceryList = await GroceryList.findOne({ weekStartDate: monday });

  if (groceryList) {
    // Preserve purchase status of existing items if names match
    const existingStatusMap = new Map();
    for (const item of groceryList.items) {
      const key = `${item.ingredientName.trim().toLowerCase()}:::${normalizeUnit(item.unit)}`;
      existingStatusMap.set(key, item.isPurchased);
    }

    const mergedItems = aggregatedItems.map((item) => {
      const key = `${item.ingredientName.trim().toLowerCase()}:::${normalizeUnit(item.unit)}`;
      if (existingStatusMap.has(key)) {
        item.isPurchased = existingStatusMap.get(key);
      }
      return item;
    });

    groceryList.items = mergedItems;
    await groceryList.save();
  } else {
    groceryList = new GroceryList({
      weekStartDate: monday,
      items: aggregatedItems,
    });
    await groceryList.save();
  }

  return groceryList;
};

export const updateGroceryList = async (id, data) => {
  const updated = await GroceryList.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    const err = new Error(`Grocery list not found with ID ${id}`);
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

export const addGroceryItem = async (listId, itemData) => {
  const groceryList = await GroceryList.findById(listId);
  if (!groceryList) {
    const err = new Error(`Grocery list not found with ID ${listId}`);
    err.statusCode = 404;
    throw err;
  }

  const newItem = {
    _id: new mongoose.Types.ObjectId(), // Stable MongoDB subdocument ID
    ingredientName: itemData.ingredientName.trim(),
    quantity: typeof itemData.quantity === 'number' && itemData.quantity >= 0 ? itemData.quantity : null,
    unit: normalizeUnit(itemData.unit || ''),
    category: itemData.category && itemData.category.trim() ? itemData.category.trim() : categorizeIngredient(itemData.ingredientName),
    isPurchased: Boolean(itemData.isPurchased),
  };

  groceryList.items.push(newItem);
  await groceryList.save();
  return groceryList;
};

export const updateGroceryItemStatus = async (listId, itemId, updates) => {
  const groceryList = await GroceryList.findById(listId);
  if (!groceryList) {
    const err = new Error(`Grocery list not found with ID ${listId}`);
    err.statusCode = 404;
    throw err;
  }

  const item = groceryList.items.id(itemId);
  if (!item) {
    const err = new Error(`Grocery item not found with ID ${itemId}`);
    err.statusCode = 404;
    throw err;
  }

  if (updates.isPurchased !== undefined) {
    item.isPurchased = Boolean(updates.isPurchased);
  }
  if (updates.quantity !== undefined) {
    item.quantity = typeof updates.quantity === 'number' && updates.quantity >= 0 ? updates.quantity : null;
  }
  if (updates.unit !== undefined) {
    item.unit = normalizeUnit(updates.unit);
  }
  if (updates.ingredientName !== undefined && updates.ingredientName.trim()) {
    item.ingredientName = updates.ingredientName.trim();
  }
  if (updates.category !== undefined && updates.category.trim()) {
    item.category = updates.category.trim();
  }

  await groceryList.save();
  return groceryList;
};

export const deleteGroceryItem = async (listId, itemId) => {
  const groceryList = await GroceryList.findById(listId);
  if (!groceryList) {
    const err = new Error(`Grocery list not found with ID ${listId}`);
    err.statusCode = 404;
    throw err;
  }

  const item = groceryList.items.id(itemId);
  if (!item) {
    const err = new Error(`Grocery item not found with ID ${itemId}`);
    err.statusCode = 404;
    throw err;
  }

  groceryList.items.pull(itemId);
  await groceryList.save();
  return groceryList;
};

export default {
  getGroceryListByWeek,
  generateGroceryList,
  updateGroceryList,
  addGroceryItem,
  updateGroceryItemStatus,
  deleteGroceryItem,
};
