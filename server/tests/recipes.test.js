import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Recipe from '../src/models/Recipe.js';
import Favorite from '../src/models/Favorite.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './testDb.js';

describe('Recipe API Endpoints', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  const validRecipe = {
    title: 'Spaghetti Bolognese',
    description: 'Hearty slow-cooked beef ragu with spaghetti.',
    cuisine: 'Italian',
    mealType: 'Dinner',
    prepTimeMinutes: 20,
    cookTimeMinutes: 45,
    servings: 4,
    difficulty: 'Medium',
    dietaryTags: ['High-Protein'],
    ingredients: [
      { name: 'Ground Beef', quantity: 500, unit: 'g' },
      { name: 'Spaghetti', quantity: 400, unit: 'g' },
      { name: 'Tomato Sauce', quantity: 2, unit: 'cup' },
    ],
    instructions: [
      { step: 1, text: 'Brown the beef with onions.' },
      { step: 2, text: 'Simmer with tomato sauce for 30 minutes.' },
    ],
  };

  it('POST /api/recipes creates a valid recipe', async () => {
    const res = await request(app).post('/api/recipes').send(validRecipe);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.title).toBe('Spaghetti Bolognese');
  });

  it('POST /api/recipes rejects invalid recipe data with validation errors', async () => {
    const invalid = {
      title: 'A', // too short
      cuisine: 'Martian', // not in enum
      prepTimeMinutes: -5, // negative
    };
    const res = await request(app).post('/api/recipes').send(invalid);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details).toBeDefined();
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('GET /api/recipes/:id retrieves an existing recipe', async () => {
    const created = await Recipe.create(validRecipe);
    const res = await request(app).get(`/api/recipes/${created._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Spaghetti Bolognese');
  });

  it('GET /api/recipes/:id returns 404 for non-existent recipe ID', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/api/recipes/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/recipes/:id updates an existing recipe', async () => {
    const created = await Recipe.create(validRecipe);
    const res = await request(app)
      .put(`/api/recipes/${created._id}`)
      .send({ title: 'Classic Spaghetti Bolognese', servings: 6 });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Classic Spaghetti Bolognese');
    expect(res.body.data.servings).toBe(6);
  });

  it('GET /api/recipes supports search, filters, pagination and sorting', async () => {
    await Recipe.create([
      {
        ...validRecipe,
        title: 'Butter Chicken',
        cuisine: 'Indian',
        mealType: 'Dinner',
        prepTimeMinutes: 15,
      },
      {
        ...validRecipe,
        title: 'Masala Dosa',
        cuisine: 'Indian',
        mealType: 'Breakfast',
        prepTimeMinutes: 30,
      },
      {
        ...validRecipe,
        title: 'Margherita Pizza',
        cuisine: 'Italian',
        mealType: 'Lunch',
        prepTimeMinutes: 10,
      },
    ]);

    // Search query
    const searchRes = await request(app).get('/api/recipes?q=Butter');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].title).toBe('Butter Chicken');

    // Cuisine filter
    const cuisineRes = await request(app).get('/api/recipes?cuisine=Indian');
    expect(cuisineRes.body.data.length).toBe(2);

    // MealType filter
    const mealTypeRes = await request(app).get('/api/recipes?mealType=Breakfast');
    expect(mealTypeRes.body.data.length).toBe(1);
    expect(mealTypeRes.body.data[0].title).toBe('Masala Dosa');

    // Sorting by prepTime (ascending)
    const sortRes = await request(app).get('/api/recipes?sort=prepTime');
    expect(sortRes.body.data[0].title).toBe('Margherita Pizza'); // 10 min

    // Pagination
    const pageRes = await request(app).get('/api/recipes?limit=2&page=1');
    expect(pageRes.body.data.length).toBe(2);
    expect(pageRes.body.meta.totalPages).toBe(2);
    expect(pageRes.body.meta.total).toBe(3);
  });

  it('DELETE /api/recipes/:id deletes a recipe', async () => {
    const created = await Recipe.create(validRecipe);
    const res = await request(app).delete(`/api/recipes/${created._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Recipe.findById(created._id);
    expect(check).toBeNull();
  });
});
