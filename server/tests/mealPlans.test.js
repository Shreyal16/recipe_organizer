import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Recipe from '../src/models/Recipe.js';
import MealPlan from '../src/models/MealPlan.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './testDb.js';

describe('Meal Plan API Endpoints', () => {
  let recipe1, recipe2;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    recipe1 = await Recipe.create({
      title: 'Oatmeal Porridge',
      description: 'Warm rolled oats with berries.',
      cuisine: 'American',
      mealType: 'Breakfast',
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      servings: 1,
      ingredients: [{ name: 'Oats', quantity: 50, unit: 'g' }],
      instructions: [{ step: 1, text: 'Simmer oats with water.' }],
    });

    recipe2 = await Recipe.create({
      title: 'Grilled Salmon',
      description: 'Pan-seared salmon fillet with lemon.',
      cuisine: 'Mediterranean',
      mealType: 'Dinner',
      prepTimeMinutes: 10,
      cookTimeMinutes: 12,
      servings: 2,
      ingredients: [{ name: 'Salmon', quantity: 300, unit: 'g' }],
      instructions: [{ step: 1, text: 'Sear salmon skin down.' }],
    });
  });

  it('POST /api/meal-plans creates a weekly plan and normalizes weekStartDate to Monday', async () => {
    // Submit with a Wednesday date: 2026-11-25
    const payload = {
      weekStartDate: '2026-11-25T14:30:00.000Z',
      days: [
        {
          date: '2026-11-23T00:00:00.000Z',
          meals: [{ mealType: 'Breakfast', recipeId: recipe1._id.toString(), servings: 1 }],
        },
      ],
    };

    const res = await request(app).post('/api/meal-plans').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Normalized to Monday 2026-11-23
    const savedMonday = new Date(res.body.data.weekStartDate).toISOString().split('T')[0];
    expect(savedMonday).toBe('2026-11-23');
    expect(res.body.data.days.length).toBe(7); // ensures 7 days initialized
  });

  it('POST /api/meal-plans enforces duplicate weekly plan protection with 409 Conflict', async () => {
    const monday = '2026-11-23T00:00:00.000Z';
    await MealPlan.create({ weekStartDate: new Date(monday), days: [] });

    const duplicateRes = await request(app).post('/api/meal-plans').send({
      weekStartDate: monday,
      days: [],
    });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error.message).toContain('already exists');
  });

  it('POST /api/meal-plans rejects invalid non-existent recipe references with 400', async () => {
    const fakeRecipeId = '507f1f77bcf86cd799439011';
    const payload = {
      weekStartDate: '2026-11-23T00:00:00.000Z',
      days: [
        {
          date: '2026-11-23T00:00:00.000Z',
          meals: [{ mealType: 'Lunch', recipeId: fakeRecipeId, servings: 2 }],
        },
      ],
    };

    const res = await request(app).post('/api/meal-plans').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('do not exist');
  });

  it('GET /api/meal-plans/:weekStart retrieves weekly plan with populated recipe objects', async () => {
    const monday = '2026-11-23T00:00:00.000Z';
    await MealPlan.create({
      weekStartDate: new Date(monday),
      days: [
        {
          date: new Date(monday),
          meals: [{ mealType: 'Dinner', recipeId: recipe2._id, servings: 2 }],
        },
      ],
    });

    const res = await request(app).get('/api/meal-plans/2026-11-23');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const day0Meals = res.body.data.days[0].meals;
    expect(day0Meals.length).toBe(1);
    expect(day0Meals[0].recipeId.title).toBe('Grilled Salmon');
  });

  it('PUT /api/meal-plans/:id updates meal configuration', async () => {
    const monday = '2026-11-23T00:00:00.000Z';
    const plan = await MealPlan.create({
      weekStartDate: new Date(monday),
      days: [
        {
          date: new Date(monday),
          meals: [{ mealType: 'Breakfast', recipeId: recipe1._id, servings: 1 }],
        },
      ],
    });

    const updatedDays = [
      {
        date: monday,
        meals: [
          { mealType: 'Breakfast', recipeId: recipe1._id.toString(), servings: 2 },
          { mealType: 'Dinner', recipeId: recipe2._id.toString(), servings: 4 },
        ],
      },
    ];

    const res = await request(app)
      .put(`/api/meal-plans/${plan._id}`)
      .send({ days: updatedDays });

    expect(res.status).toBe(200);
    expect(res.body.data.days[0].meals.length).toBe(2);
    expect(res.body.data.days[0].meals[1].servings).toBe(4);
  });

  it('DELETE /api/meal-plans/:id deletes a weekly plan', async () => {
    const monday = '2026-11-23T00:00:00.000Z';
    const plan = await MealPlan.create({
      weekStartDate: new Date(monday),
      days: [],
    });

    const res = await request(app).delete(`/api/meal-plans/${plan._id}`);
    expect(res.status).toBe(200);

    const check = await MealPlan.findById(plan._id);
    expect(check).toBeNull();
  });
});
