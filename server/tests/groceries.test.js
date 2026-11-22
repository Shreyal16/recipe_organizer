import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Recipe from '../src/models/Recipe.js';
import MealPlan from '../src/models/MealPlan.js';
import GroceryList from '../src/models/GroceryList.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './testDb.js';

describe('Grocery List API Endpoints', () => {
  let recipeA, recipeB;
  const monday = '2026-11-23T00:00:00.000Z';

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    recipeA = await Recipe.create({
      title: 'Tacos',
      description: 'Beef tacos.',
      cuisine: 'Mexican',
      mealType: 'Dinner',
      prepTimeMinutes: 10,
      servings: 2,
      ingredients: [
        { name: 'Ground Beef', quantity: 200, unit: 'g' },
        { name: 'Tortillas', quantity: 4, unit: 'piece' },
      ],
      instructions: [{ step: 1, text: 'Fill tortillas.' }],
    });

    recipeB = await Recipe.create({
      title: 'Guacamole',
      description: 'Avocado dip.',
      cuisine: 'Mexican',
      mealType: 'Snack',
      prepTimeMinutes: 5,
      servings: 2,
      ingredients: [
        { name: 'Avocado', quantity: 2, unit: 'piece' },
        { name: 'Lime', quantity: 1, unit: 'piece' },
      ],
      instructions: [{ step: 1, text: 'Mash avocado.' }],
    });
  });

  it('POST /api/grocery-list/generate aggregates and scales ingredients from scheduled weekly meals', async () => {
    // Plan with 4 servings of Tacos (2x base servings of 2)
    await MealPlan.create({
      weekStartDate: new Date(monday),
      days: [
        {
          date: new Date(monday),
          meals: [
            { mealType: 'Dinner', recipeId: recipeA._id, servings: 4 },
            { mealType: 'Snack', recipeId: recipeB._id, servings: 2 },
          ],
        },
      ],
    });

    const res = await request(app)
      .post('/api/grocery-lists/generate')
      .send({ weekStartDate: '2026-11-23' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const items = res.body.data.items;
    expect(items.length).toBeGreaterThan(0);

    // Ground Beef should be scaled 200g * 2 = 400g
    const beef = items.find((i) => i.ingredientName.toLowerCase().includes('ground beef'));
    expect(beef).toBeDefined();
    expect(beef.quantity).toBe(400);

    // Tortillas scaled 4 * 2 = 8
    const tortillas = items.find((i) => i.ingredientName.toLowerCase().includes('tortilla'));
    expect(tortillas).toBeDefined();
    expect(tortillas.quantity).toBe(8);
  });

  it('POST /api/grocery-lists/generate returns 404 when no meal plan exists for week', async () => {
    const res = await request(app)
      .post('/api/grocery-lists/generate')
      .send({ weekStartDate: '2027-01-04' });

    expect(res.status).toBe(404);
  });

  it('PATCH /api/grocery-lists/:id/items/:itemId toggles purchased status', async () => {
    const list = await GroceryList.create({
      weekStartDate: new Date(monday),
      items: [{ ingredientName: 'Avocado', quantity: 2, unit: 'piece', isPurchased: false }],
    });

    const itemId = list.items[0]._id;
    const res = await request(app)
      .patch(`/api/grocery-lists/${list._id}/items/${itemId}`)
      .send({ isPurchased: true });

    expect(res.status).toBe(200);
    const updated = await GroceryList.findById(list._id);
    expect(updated.items[0].isPurchased).toBe(true);
  });

  it('POST /api/grocery-lists/:id/items adds a custom grocery item', async () => {
    const list = await GroceryList.create({
      weekStartDate: new Date(monday),
      items: [],
    });

    const res = await request(app)
      .post(`/api/grocery-lists/${list._id}/items`)
      .send({
        ingredientName: 'Paper Towels',
        quantity: 2,
        unit: 'rolls',
        category: 'Pantry & General',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].ingredientName).toBe('Paper Towels');
  });

  it('DELETE /api/grocery-lists/:id/items/:itemId deletes a grocery item', async () => {
    const list = await GroceryList.create({
      weekStartDate: new Date(monday),
      items: [{ ingredientName: 'Mustard', quantity: 1, unit: 'bottle' }],
    });

    const itemId = list.items[0]._id;
    const res = await request(app).delete(`/api/grocery-lists/${list._id}/items/${itemId}`);
    expect(res.status).toBe(200);

    const updated = await GroceryList.findById(list._id);
    expect(updated.items.length).toBe(0);
  });
});
