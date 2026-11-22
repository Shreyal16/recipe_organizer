import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import UserPreference from '../src/models/UserPreference.js';
import { setupTestDb, teardownTestDb, clearTestDb } from './testDb.js';

describe('User Preferences API Endpoints', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('GET /api/preferences initializes and returns default preferences profile if none exists', async () => {
    const res = await request(app).get('/api/preferences');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profileKey).toBe('default');
    expect(Array.isArray(res.body.data.preferredCuisines)).toBe(true);
    expect(Array.isArray(res.body.data.pantryIngredients)).toBe(true);
  });

  it('PUT /api/preferences updates cuisines, dietary preferences, and pantry ingredients', async () => {
    const updatePayload = {
      preferredCuisines: ['Indian', 'Mexican'],
      dietaryPreferences: ['Vegetarian'],
      pantryIngredients: ['garlic', 'olive oil', 'paprika'],
    };

    const res = await request(app).put('/api/preferences').send(updatePayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preferredCuisines).toEqual(['Indian', 'Mexican']);
    expect(res.body.data.pantryIngredients).toEqual(['garlic', 'olive oil', 'paprika']);
  });

  it('PUT /api/preferences preserves unprovided fields when updating partially', async () => {
    // Initial setup
    await request(app).put('/api/preferences').send({
      preferredCuisines: ['Italian'],
      dietaryPreferences: ['Gluten-Free'],
      pantryIngredients: ['pasta', 'tomatoes'],
    });

    // Update only pantryIngredients
    const res = await request(app).put('/api/preferences').send({
      pantryIngredients: ['pasta', 'tomatoes', 'basil'],
    });

    expect(res.status).toBe(200);
    expect(res.body.data.preferredCuisines).toEqual(['Italian']);
    expect(res.body.data.dietaryPreferences).toEqual(['Gluten-Free']);
    expect(res.body.data.pantryIngredients).toEqual(['pasta', 'tomatoes', 'basil']);
  });
});
