import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import Favorite from '../src/models/Favorite.js';
import MealPlan from '../src/models/MealPlan.js';
import { deleteRecipe } from '../src/services/recipeService.js';
import { getMealPlanByWeek } from '../src/services/mealPlanService.js';
import { generateGroceryList } from '../src/services/groceryListService.js';
import {
  setupTestReplSetDb,
  teardownTestDb as teardownReplSetDb,
  setupTestDb,
  teardownTestDb as teardownStandaloneDb,
} from './testDb.js';

describe('Recipe Deletion & Dependent Reference Integrity Suite', () => {
  // -----------------------------------------------------------------
  // 1. REPLICA SET / TRANSACTIONAL EXECUTION PATH
  // -----------------------------------------------------------------
  describe('MongoMemoryReplSet (Multi-Document Transactions)', () => {
    beforeAll(async () => {
      await setupTestReplSetDb();
      // Ensure collections and indexes are fully created to avoid catalog changes during transaction
      await Promise.all([Recipe.init(), MealPlan.init(), Favorite.init()]);
    });

    afterAll(async () => {
      await teardownReplSetDb();
    });

    it('successfully executes atomic transactional deletion with complete reference cleanup', async () => {
      const recipeA = await Recipe.create({
        title: 'Recipe A - Butter Chicken',
        description: 'Gravy dish',
        cuisine: 'Indian',
        mealType: 'Dinner',
        prepTimeMinutes: 20,
        servings: 4,
        ingredients: [{ name: 'Chicken', quantity: 500, unit: 'g' }],
        instructions: [{ step: 1, text: 'Cook gravy.' }],
      });

      const recipeB = await Recipe.create({
        title: 'Recipe B - Pasta Carbonara',
        description: 'Italian pasta',
        cuisine: 'Italian',
        mealType: 'Lunch',
        prepTimeMinutes: 15,
        servings: 2,
        ingredients: [{ name: 'Pasta', quantity: 200, unit: 'g' }],
        instructions: [{ step: 1, text: 'Boil pasta.' }],
      });

      const favA = await Favorite.create({ recipeId: recipeA._id });

      const monday = new Date('2026-11-23T00:00:00.000Z');
      const mealPlan = await MealPlan.create({
        weekStartDate: monday,
        days: [
          {
            date: monday,
            meals: [
              { mealType: 'Dinner', recipeId: recipeA._id, servings: 4 },
              { mealType: 'Lunch', recipeId: recipeB._id, servings: 2 },
            ],
          },
          {
            date: new Date('2026-11-24T00:00:00.000Z'),
            meals: [{ mealType: 'Dinner', recipeId: recipeA._id, servings: 2 }],
          },
        ],
      });

      // Execute transactional delete
      const deleted = await deleteRecipe(recipeA._id.toString());
      expect(deleted).toBeDefined();
      expect(deleted.title).toBe('Recipe A - Butter Chicken');

      // 1. Recipe A is deleted
      const checkA = await Recipe.findById(recipeA._id);
      expect(checkA).toBeNull();

      // 2. Recipe B remains completely intact
      const checkB = await Recipe.findById(recipeB._id);
      expect(checkB).not.toBeNull();
      expect(checkB.title).toBe('Recipe B - Pasta Carbonara');

      // 3. Favorite for Recipe A is deleted
      const checkFavA = await Favorite.findById(favA._id);
      expect(checkFavA).toBeNull();

      // 4. MealPlan references to Recipe A removed across all days
      const updatedPlan = await MealPlan.findById(mealPlan._id);
      expect(updatedPlan.days[0].meals.length).toBe(1);
      expect(updatedPlan.days[0].meals[0].recipeId.toString()).toBe(recipeB._id.toString());
      expect(updatedPlan.days[1].meals.length).toBe(0);

      // 5. Subsequent queries and grocery list succeed without crashing
      const fetchedPlan = await getMealPlanByWeek(monday);
      expect(fetchedPlan).not.toBeNull();

      const groceryList = await generateGroceryList(monday);
      expect(groceryList).not.toBeNull();
      expect(groceryList.items.length).toBeGreaterThan(0);
    });

    it('rolls back all operations when a failure occurs during cleanup inside a transaction', async () => {
      const recipeC = await Recipe.create({
        title: 'Recipe C - Rollback Test',
        description: 'Should not be deleted on abort',
        cuisine: 'Mexican',
        mealType: 'Dinner',
        prepTimeMinutes: 10,
        servings: 2,
        ingredients: [{ name: 'Beans', quantity: 100, unit: 'g' }],
        instructions: [{ step: 1, text: 'Warm beans.' }],
      });

      const favC = await Favorite.create({ recipeId: recipeC._id });

      // Spy on Favorite.deleteMany to throw an error during the transaction
      const deleteManySpy = vi.spyOn(Favorite, 'deleteMany').mockImplementationOnce(async () => {
        throw new Error('Injected simulated database error during transaction cleanup');
      });

      let caughtError = null;
      try {
        await deleteRecipe(recipeC._id.toString());
      } catch (err) {
        caughtError = err;
      }

      deleteManySpy.mockRestore();

      expect(caughtError).not.toBeNull();
      expect(caughtError.message).toContain('Injected simulated database error');

      // Assert rollback: Recipe C and Favorite C both still exist
      const checkRecipeC = await Recipe.findById(recipeC._id);
      const checkFavC = await Favorite.findById(favC._id);

      expect(checkRecipeC).not.toBeNull();
      expect(checkFavC).not.toBeNull();
    });
  });

  // -----------------------------------------------------------------
  // 2. STANDALONE FALLBACK EXECUTION PATH
  // -----------------------------------------------------------------
  describe('MongoMemoryServer (Standalone Fallback Path)', () => {
    beforeAll(async () => {
      await setupTestDb();
    });

    afterAll(async () => {
      await teardownStandaloneDb();
    });

    it('executes cleanup-first delete-last fallback when session throws standalone replica set error', async () => {
      const recipeD = await Recipe.create({
        title: 'Recipe D - Standalone Test',
        description: 'Tested with simulated standalone mongod',
        cuisine: 'American',
        mealType: 'Lunch',
        prepTimeMinutes: 10,
        servings: 1,
        ingredients: [{ name: 'Bread', quantity: 2, unit: 'slices' }],
        instructions: [{ step: 1, text: 'Toast.' }],
      });

      const favD = await Favorite.create({ recipeId: recipeD._id });

      const monday = new Date('2026-11-23T00:00:00.000Z');
      const planD = await MealPlan.create({
        weekStartDate: monday,
        days: [
          {
            date: monday,
            meals: [{ mealType: 'Lunch', recipeId: recipeD._id, servings: 1 }],
          },
        ],
      });

      // Force startSession to throw replica set standalone error
      const sessionSpy = vi.spyOn(mongoose, 'startSession').mockImplementationOnce(async () => {
        throw new Error('Transaction numbers are only allowed on a replica set member or mongos');
      });

      const deleted = await deleteRecipe(recipeD._id.toString());
      sessionSpy.mockRestore();

      expect(deleted).not.toBeNull();
      expect(deleted.title).toBe('Recipe D - Standalone Test');

      const checkRecipeD = await Recipe.findById(recipeD._id);
      const checkFavD = await Favorite.findById(favD._id);
      const updatedPlan = await MealPlan.findById(planD._id);

      expect(checkRecipeD).toBeNull();
      expect(checkFavD).toBeNull();
      expect(updatedPlan.days[0].meals.length).toBe(0);
    });

    it('keeps recipe undeleted when cleanup fails in standalone fallback mode', async () => {
      const recipeE = await Recipe.create({
        title: 'Recipe E - Fallback Failure Safety',
        description: 'Should remain intact if cleanup fails',
        cuisine: 'Italian',
        mealType: 'Dinner',
        prepTimeMinutes: 10,
        servings: 2,
        ingredients: [{ name: 'Tomato', quantity: 1, unit: 'piece' }],
        instructions: [{ step: 1, text: 'Cook.' }],
      });

      const favE = await Favorite.create({ recipeId: recipeE._id });

      // Simulate standalone environment
      const sessionSpy = vi.spyOn(mongoose, 'startSession').mockImplementationOnce(async () => {
        throw new Error('Transaction numbers are only allowed on a replica set member or mongos');
      });

      // Simulate failure during Favorite cleanup
      const deleteManySpy = vi.spyOn(Favorite, 'deleteMany').mockImplementationOnce(async () => {
        throw new Error('Disk I/O error during standalone cleanup');
      });

      let caughtError = null;
      try {
        await deleteRecipe(recipeE._id.toString());
      } catch (err) {
        caughtError = err;
      }

      sessionSpy.mockRestore();
      deleteManySpy.mockRestore();

      expect(caughtError).not.toBeNull();
      expect(caughtError.message).toContain('Disk I/O error');

      // Recipe E must NOT be deleted
      const checkRecipeE = await Recipe.findById(recipeE._id);
      expect(checkRecipeE).not.toBeNull();
    });
  });
});
