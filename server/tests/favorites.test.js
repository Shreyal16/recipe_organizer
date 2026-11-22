import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Recipe from '../src/models/Recipe.js';
import Favorite from '../src/models/Favorite.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './testDb.js';

describe('Favorite API Endpoints', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  const sampleRecipe = {
    title: 'Avocado Toast',
    description: 'Crisp sourdough with smashed avocado.',
    cuisine: 'American',
    mealType: 'Breakfast',
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    servings: 1,
    ingredients: [{ name: 'Bread', quantity: 2, unit: 'slice' }, { name: 'Avocado', quantity: 1, unit: 'piece' }],
    instructions: [{ step: 1, text: 'Toast bread and top with avocado.' }],
  };

  it('POST /api/favorites saves a recipe to favorites', async () => {
    const recipe = await Recipe.create(sampleRecipe);
    const res = await request(app).post('/api/favorites').send({ recipeId: recipe._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipeId._id.toString()).toBe(recipe._id.toString());
  });

  it('POST /api/favorites prevents duplicate favorites with 409 Conflict', async () => {
    const recipe = await Recipe.create(sampleRecipe);
    await request(app).post('/api/favorites').send({ recipeId: recipe._id.toString() });

    const duplicateRes = await request(app).post('/api/favorites').send({ recipeId: recipe._id.toString() });
    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error.message).toContain('already in favorites');
  });

  it('POST /api/favorites rejects non-existent recipe with 404', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011';
    const res = await request(app).post('/api/favorites').send({ recipeId: nonExistentId });
    expect(res.status).toBe(404);
  });

  it('GET /api/favorites retrieves all saved favorites with populated recipe data', async () => {
    const recipe = await Recipe.create(sampleRecipe);
    await request(app).post('/api/favorites').send({ recipeId: recipe._id.toString() });

    const res = await request(app).get('/api/favorites');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].recipeId.title).toBe('Avocado Toast');
  });

  it('DELETE /api/favorites/:recipeId removes a favorite', async () => {
    const recipe = await Recipe.create(sampleRecipe);
    await request(app).post('/api/favorites').send({ recipeId: recipe._id.toString() });

    const deleteRes = await request(app).delete(`/api/favorites/${recipe._id}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const getRes = await request(app).get('/api/favorites');
    expect(getRes.body.data.length).toBe(0);
  });

  it('GET /api/favorites gracefully handles and preserves rawRecipeId with null recipe for stale references', async () => {
    const recipe = await Recipe.create(sampleRecipe);
    await Favorite.create({ recipeId: recipe._id });

    // Directly delete recipe to simulate dangling reference
    await Recipe.findByIdAndDelete(recipe._id);

    const res = await request(app).get('/api/favorites');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].recipeId).toBeNull();
    expect(res.body.data[0].rawRecipeId).toBe(recipe._id.toString());
  });
});
