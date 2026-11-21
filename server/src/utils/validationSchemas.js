import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const recipeIngredientZodSchema = z.object({
  name: z.string().min(1, 'Ingredient name cannot be empty'),
  quantity: z.number().nullable().optional().default(null),
  unit: z.string().optional().default(''),
});

export const recipeInstructionZodSchema = z.object({
  step: z.number().int().min(1, 'Step must be a positive integer'),
  text: z.string().min(1, 'Instruction text cannot be empty'),
});

export const recipeCreateZodSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
  cuisine: z.string().min(1, 'Cuisine is required'),
  mealType: z.string().min(1, 'Meal type is required'),
  prepTimeMinutes: z.number().int().min(0, 'Prep time cannot be negative'),
  cookTimeMinutes: z.number().int().min(0, 'Cook time cannot be negative').optional().default(0),
  servings: z.number().int().min(1, 'Servings must be at least 1'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().default('Medium'),
  dietaryTags: z.array(z.string()).optional().default([]),
  ingredients: z.array(recipeIngredientZodSchema).min(1, 'At least one ingredient is required'),
  instructions: z.array(recipeInstructionZodSchema).min(1, 'At least one instruction step is required'),
  seasonalTags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
});

export const recipeUpdateZodSchema = recipeCreateZodSchema.partial();

export const recipeQueryZodSchema = z.object({
  q: z.string().optional(),
  ingredients: z.string().optional(),
  ingredientMatch: z.enum(['any', 'all']).optional().default('any'),
  cuisine: z.string().optional(),
  mealType: z.string().optional(),
  maxPrepTime: z.string().regex(/^\d+$/).optional(),
  dietaryTags: z.string().optional(),
  sort: z.enum(['newest', 'prepTime', 'title', 'popularity']).optional().default('newest'),
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('12'),
});

export const favoriteCreateZodSchema = z.object({
  recipeId: z.string().regex(objectIdRegex, 'recipeId must be a valid 24-character hex MongoDB ObjectId'),
});

export const preferenceUpdateZodSchema = z.object({
  preferredCuisines: z.array(z.string()).optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  pantryIngredients: z.array(z.string()).optional(),
});

export const mealEntryZodSchema = z.object({
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']),
  recipeId: z.string().regex(objectIdRegex, 'recipeId must be a valid MongoDB ObjectId'),
  servings: z.number().int().min(1, 'Servings must be at least 1').default(1),
});

export const dayPlanZodSchema = z.object({
  date: z.string().or(z.date()),
  meals: z.array(mealEntryZodSchema).optional().default([]),
});

export const mealPlanCreateZodSchema = z.object({
  weekStartDate: z.string().min(1, 'weekStartDate is required (ISO 8601 string)'),
  days: z.array(dayPlanZodSchema).optional().default([]),
});

export const mealPlanUpdateZodSchema = z.object({
  weekStartDate: z.string().optional(),
  days: z.array(dayPlanZodSchema).optional(),
});

export const groceryGenerateZodSchema = z.object({
  weekStartDate: z.string().min(1, 'weekStartDate is required to generate grocery list'),
});

export const groceryItemCreateZodSchema = z.object({
  ingredientName: z.string().min(1, 'ingredientName is required'),
  quantity: z.number().nullable().optional().default(null),
  unit: z.string().optional().default(''),
  category: z.string().optional().default('Pantry & General'),
  isPurchased: z.boolean().optional().default(false),
});

export const groceryItemPatchZodSchema = z.object({
  isPurchased: z.boolean().optional(),
  quantity: z.number().nullable().optional(),
  unit: z.string().optional(),
  ingredientName: z.string().optional(),
  category: z.string().optional(),
});

export default {
  recipeCreateZodSchema,
  recipeUpdateZodSchema,
  recipeQueryZodSchema,
  favoriteCreateZodSchema,
  preferenceUpdateZodSchema,
  mealPlanCreateZodSchema,
  mealPlanUpdateZodSchema,
  groceryGenerateZodSchema,
  groceryItemCreateZodSchema,
  groceryItemPatchZodSchema,
};
