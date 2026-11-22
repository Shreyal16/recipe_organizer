import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Recipe from '../src/models/Recipe.js';
import Favorite from '../src/models/Favorite.js';
import UserPreference from '../src/models/UserPreference.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './testDb.js';

describe('Insights & Recommendations API Endpoints', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('GET /api/insights returns all 5 required insight categories with rule-based scoring', async () => {
    // 1. Seed preferences: pantry with olive oil, garlic, basil; preferred cuisine Italian
    await UserPreference.create({
      profileKey: 'default',
      preferredCuisines: ['Italian'],
      dietaryPreferences: ['Vegetarian'],
      pantryIngredients: ['olive oil', 'garlic', 'fresh basil', 'tomatoes'],
    });

    // 2. Seed recipes
    const r1 = await Recipe.create({
      title: 'Bruschetta',
      description: 'Toasted bread with tomatoes.',
      cuisine: 'Italian',
      mealType: 'Snack',
      prepTimeMinutes: 10,
      servings: 2,
      dietaryTags: ['Vegetarian'],
      ingredients: [
        { name: 'Tomatoes', quantity: 2, unit: 'piece' },
        { name: 'Garlic', quantity: 1, unit: 'clove' },
        { name: 'Olive Oil', quantity: 1, unit: 'tbsp' },
      ],
      instructions: [{ step: 1, text: 'Top bread with mixture.' }],
    });

    const r2 = await Recipe.create({
      title: 'Chicken Tikka',
      description: 'Spiced chicken skewers.',
      cuisine: 'Indian',
      mealType: 'Dinner',
      prepTimeMinutes: 20,
      servings: 2,
      dietaryTags: ['High-Protein'],
      ingredients: [
        { name: 'Chicken', quantity: 500, unit: 'g' },
        { name: 'Yogurt', quantity: 100, unit: 'g' },
      ],
      instructions: [{ step: 1, text: 'Grill skewers.' }],
    });

    // 3. Seed Favorite for Bruschetta
    await Favorite.create({ recipeId: r1._id });

    // 4. Fetch Insights
    const res = await request(app).get('/api/insights');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const {
      preferredCuisines,
      frequentlySavedRecipes,
      commonIngredients,
      popularMealTypes,
      recommendations,
    } = res.body.data;

    // Category 1: Preferred Cuisines
    expect(Array.isArray(preferredCuisines)).toBe(true);
    expect(preferredCuisines.length).toBe(2);

    // Category 2: Frequently Saved Recipes
    expect(Array.isArray(frequentlySavedRecipes)).toBe(true);
    expect(frequentlySavedRecipes.length).toBe(1);
    expect(frequentlySavedRecipes[0].title).toBe('Bruschetta');

    // Category 3: Common Ingredients
    expect(Array.isArray(commonIngredients)).toBe(true);
    expect(commonIngredients.length).toBeGreaterThan(0);

    // Category 4: Popular Meal Types (collection by meal type)
    expect(Array.isArray(popularMealTypes)).toBe(true);
    expect(popularMealTypes.length).toBe(2);

    // Category 5: Recommendations
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);

    // Bruschetta should rank higher due to 100% pantry overlap + Italian cuisine boost + Vegetarian boost
    const topRec = recommendations[0];
    expect(topRec.recipe.title).toBe('Bruschetta');
    expect(topRec.matchPercentage).toBeGreaterThanOrEqual(100); // 100% base + 10 cuisine boost capped at 100
    expect(topRec.matchedIngredients.length).toBe(3);
    expect(topRec.reason).toContain('pantry ingredient');
  });
});
