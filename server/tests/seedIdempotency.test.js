import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Recipe from '../src/models/Recipe.js';
import { seedRecipes, sampleRecipes } from '../src/seed/seedRecipes.js';
import { setupTestDb, teardownTestDb } from './testDb.js';

describe('Seed Idempotency in Isolated In-Memory Database', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('runs seedRecipes twice and guarantees zero duplicate records and exact count preservation', async () => {
    expect(sampleRecipes.length).toBeGreaterThan(0);
    const expectedTotal = sampleRecipes.length;

    // Run 1: Initial seed
    const run1Result = await seedRecipes();
    expect(run1Result.inserted).toBe(expectedTotal);
    expect(run1Result.updated).toBe(0);
    expect(run1Result.skipped).toBe(0);

    const countAfterRun1 = await Recipe.countDocuments();
    expect(countAfterRun1).toBe(expectedTotal);

    // Run 2: Second seed on existing data
    const run2Result = await seedRecipes();
    expect(run2Result.inserted).toBe(0);
    expect(run2Result.updated).toBe(expectedTotal);
    expect(run2Result.skipped).toBe(0);

    const countAfterRun2 = await Recipe.countDocuments();
    expect(countAfterRun2).toBe(expectedTotal);

    // Verify individual sample recipe titles are unique in the collection
    const distinctTitles = await Recipe.distinct('title');
    expect(distinctTitles.length).toBe(expectedTotal);
  });
});
