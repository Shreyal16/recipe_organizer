import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { setupTestReplSetDb, clearTestDb, teardownTestDb } from './testDb.js';
import app from '../src/app.js';
import Recipe from '../src/models/Recipe.js';
import Favorite from '../src/models/Favorite.js';
import MealPlan from '../src/models/MealPlan.js';
import GroceryList from '../src/models/GroceryList.js';
import UserPreference from '../src/models/UserPreference.js';

describe('End-to-End API Integration Workflows', () => {
  beforeAll(async () => {
    await setupTestReplSetDb();
  }, 40000);

  afterAll(async () => {
    await teardownTestDb();
  }, 20000);

  beforeEach(async () => {
    await clearTestDb();
  });

  // Workflow 1: Recipe CRUD Lifecycle
  it('Workflow 1: creates a recipe, retrieves it, edits it, and deletes it', async () => {
    const newRecipe = {
      title: 'Creamy Garlic Mushroom Risotto',
      description: 'Slow-cooked arborio rice infused with garlic, vegetable broth, and wild mushrooms.',
      cuisine: 'Italian',
      mealType: 'Dinner',
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      servings: 4,
      difficulty: 'Medium',
      dietaryTags: ['Vegetarian', 'Gluten-Free'],
      ingredients: [
        { name: 'Arborio Rice', quantity: 300, unit: 'g', category: 'Pantry & Spices' },
        { name: 'Cremini Mushrooms', quantity: 200, unit: 'g', category: 'Produce' },
        { name: 'Garlic', quantity: 4, unit: 'cloves', category: 'Produce' },
        { name: 'Vegetable Broth', quantity: 800, unit: 'ml', category: 'Pantry & Spices' },
      ],
      instructions: [
        { step: 1, text: 'Saute garlic and sliced mushrooms in olive oil until golden.' },
        { step: 2, text: 'Add arborio rice and toast for 2 minutes.' },
        { step: 3, text: 'Gradually add warm broth ladle by ladle while stirring continuously until creamy.' },
      ],
    };

    // 1. Create
    const createRes = await request(app)
      .post('/api/recipes')
      .send(newRecipe)
      .expect(201);

    expect(createRes.body.success).toBe(true);
    const createdId = createRes.body.data._id;
    expect(createdId).toBeDefined();

    // 2. Retrieve
    const getRes = await request(app)
      .get(`/api/recipes/${createdId}`)
      .expect(200);

    expect(getRes.body.data.title).toBe('Creamy Garlic Mushroom Risotto');
    expect(getRes.body.data.ingredients.length).toBe(4);

    // 3. Edit (update servings and title)
    const updateRes = await request(app)
      .put(`/api/recipes/${createdId}`)
      .send({
        ...newRecipe,
        title: 'Creamy Garlic Wild Mushroom Risotto',
        servings: 6,
      })
      .expect(200);

    expect(updateRes.body.data.title).toBe('Creamy Garlic Wild Mushroom Risotto');
    expect(updateRes.body.data.servings).toBe(6);

    // 4. Delete
    await request(app)
      .delete(`/api/recipes/${createdId}`)
      .expect(200);

    // 5. Verify 404 on subsequent get
    await request(app)
      .get(`/api/recipes/${createdId}`)
      .expect(404);
  });

  // Workflow 2: Favorite creation, duplicate prevention, and removal
  it('Workflow 2: adds a favorite, prevents duplicate additions, and removes it', async () => {
    const recipe = await Recipe.create({
      title: 'Avocado Toast',
      description: 'Sourdough bread topped with mashed avocado and poached egg.',
      cuisine: 'American',
      mealType: 'Breakfast',
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      servings: 1,
      difficulty: 'Easy',
      ingredients: [{ name: 'Sourdough Bread', quantity: 2, unit: 'slices', category: 'Bakery' }],
      instructions: [{ step: 1, text: 'Toast bread and top with avocado.' }],
    });

    // 1. Add favorite
    const addRes = await request(app)
      .post('/api/favorites')
      .send({ recipeId: recipe._id.toString() })
      .expect(201);

    expect(addRes.body.success).toBe(true);

    // 2. Duplicate prevention (409 Conflict)
    const duplicateRes = await request(app)
      .post('/api/favorites')
      .send({ recipeId: recipe._id.toString() })
      .expect(409);

    expect(duplicateRes.body.success).toBe(false);

    // 3. Check list
    const listRes = await request(app).get('/api/favorites').expect(200);
    expect(listRes.body.data.length).toBe(1);

    // 4. Remove favorite
    await request(app)
      .delete(`/api/favorites/${recipe._id.toString()}`)
      .expect(200);

    // 5. Verify list is empty
    const listAfterRes = await request(app).get('/api/favorites').expect(200);
    expect(listAfterRes.body.data.length).toBe(0);
  });

  // Workflow 3: User preferences, pantry ingredients, and recommendations
  it('Workflow 3: saves cuisine and pantry preferences and updates recommendation results', async () => {
    // Seed Italian recipe that uses Garlic and Tomatoes
    const italianRecipe = await Recipe.create({
      title: 'Classic Tomato Bruschetta',
      description: 'Crisp rustic bread topped with diced tomatoes, minced garlic, and fresh basil.',
      cuisine: 'Italian',
      mealType: 'Snack',
      prepTimeMinutes: 10,
      cookTimeMinutes: 5,
      servings: 4,
      difficulty: 'Easy',
      ingredients: [
        { name: 'Garlic', quantity: 3, unit: 'cloves', category: 'Produce' },
        { name: 'Tomatoes', quantity: 4, unit: 'medium', category: 'Produce' },
        { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry & Spices' },
        { name: 'Fresh Basil', quantity: 6, unit: 'leaves', category: 'Produce' },
      ],
      instructions: [{ step: 1, text: 'Mix tomatoes with garlic and olive oil.' }],
    });

    // Seed Mexican recipe
    await Recipe.create({
      title: 'Black Bean Quesadillas',
      description: 'Cheesy tortillas packed with seasoned black beans and cilantro.',
      cuisine: 'Mexican',
      mealType: 'Lunch',
      prepTimeMinutes: 10,
      cookTimeMinutes: 10,
      servings: 2,
      difficulty: 'Easy',
      ingredients: [
        { name: 'Corn Tortillas', quantity: 4, unit: 'piece', category: 'Pantry & Spices' },
        { name: 'Black Beans', quantity: 1, unit: 'can', category: 'Pantry & Spices' },
      ],
      instructions: [{ step: 1, text: 'Assemble and cook quesadilla.' }],
    });

    // Save preferences with Italian cuisine and pantry ingredients matching Bruschetta
    const prefRes = await request(app)
      .put('/api/preferences')
      .send({
        preferredCuisines: ['Italian'],
        dietaryPreferences: ['Vegetarian'],
        pantryIngredients: ['Garlic', 'Tomatoes', 'Olive Oil'],
      })
      .expect(200);

    expect(prefRes.body.data.preferredCuisines).toContain('Italian');
    expect(prefRes.body.data.pantryIngredients.length).toBe(3);

    // Retrieve insights and verify recommendations
    const insightsRes = await request(app).get('/api/insights').expect(200);
    expect(insightsRes.body.success).toBe(true);

    const recs = insightsRes.body.data.recommendations;
    expect(recs.length).toBeGreaterThan(0);

    // Top recommendation should be Italian Bruschetta
    const topRec = recs.find((r) => r.recipe.title === 'Classic Tomato Bruschetta');
    expect(topRec).toBeDefined();
    expect(topRec.matchPercentage).toBeGreaterThan(50);
    expect(topRec.matchedIngredients.length).toBeGreaterThanOrEqual(2);
  });

  // Workflow 4: Retrieve Insights and verify all available insight data
  it('Workflow 4: retrieves Insights and verifies all aggregated metrics and data distributions', async () => {
    // Seed 2 recipes across different cuisines and meal types
    const r1 = await Recipe.create({
      title: 'Spaghetti Pomodoro',
      description: 'Pasta in fresh tomato and basil sauce.',
      cuisine: 'Italian',
      mealType: 'Dinner',
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      servings: 2,
      ingredients: [{ name: 'Spaghetti', quantity: 200, unit: 'g', category: 'Pantry & Spices' }],
      instructions: [{ step: 1, text: 'Boil pasta and toss with sauce.' }],
    });

    const r2 = await Recipe.create({
      title: 'Huevos Rancheros',
      description: 'Fried eggs on corn tortillas with warm salsa.',
      cuisine: 'Mexican',
      mealType: 'Breakfast',
      prepTimeMinutes: 10,
      cookTimeMinutes: 10,
      servings: 2,
      ingredients: [{ name: 'Eggs', quantity: 4, unit: 'piece', category: 'Dairy' }],
      instructions: [{ step: 1, text: 'Fry eggs and serve on tortillas.' }],
    });

    // Add r1 to favorites
    await Favorite.create({ recipeId: r1._id });

    // Request insights
    const res = await request(app).get('/api/insights').expect(200);
    const { preferredCuisines, popularMealTypes, commonIngredients, frequentlySavedRecipes } = res.body.data;

    // Verify cuisines
    expect(preferredCuisines.some((c) => c.cuisine === 'Italian')).toBe(true);
    expect(preferredCuisines.some((c) => c.cuisine === 'Mexican')).toBe(true);

    // Verify meal types
    expect(popularMealTypes.some((m) => m.mealType === 'Dinner')).toBe(true);
    expect(popularMealTypes.some((m) => m.mealType === 'Breakfast')).toBe(true);

    // Verify saved recipes contains Spaghetti Pomodoro
    expect(frequentlySavedRecipes.some((f) => f.title === 'Spaghetti Pomodoro')).toBe(true);
  });

  // Workflow 5: Meal Plan Creation, Movement, and Retrieval
  it('Workflow 5: creates a weekly meal plan, submits moved meal configuration, and verifies saved plan', async () => {
    const r1 = await Recipe.create({
      title: 'Oatmeal Porridge',
      description: 'Warm rolled oats cooked in milk with honey.',
      cuisine: 'American',
      mealType: 'Breakfast',
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      servings: 2,
      ingredients: [{ name: 'Rolled Oats', quantity: 100, unit: 'g', category: 'Pantry & Spices' }],
      instructions: [{ step: 1, text: 'Simmer oats with milk.' }],
    });

    const weekStart = '2026-11-23';

    // 1. Create meal plan with meal on Monday Breakfast
    const planRes = await request(app)
      .post('/api/meal-plans')
      .send({
        weekStartDate: weekStart,
        days: [
          {
            date: '2026-11-23T00:00:00.000Z',
            meals: [{ mealType: 'Breakfast', recipeId: r1._id.toString(), servings: 2 }],
          },
          { date: '2026-11-24T00:00:00.000Z', meals: [] },
          { date: '2026-11-25T00:00:00.000Z', meals: [] },
          { date: '2026-11-26T00:00:00.000Z', meals: [] },
          { date: '2026-11-27T00:00:00.000Z', meals: [] },
          { date: '2026-11-28T00:00:00.000Z', meals: [] },
          { date: '2026-11-29T00:00:00.000Z', meals: [] },
        ],
      })
      .expect(201);

    const planId = planRes.body.data._id;
    expect(planId).toBeDefined();

    // 2. Submit moved configuration (moved to Tuesday Dinner)
    const updateRes = await request(app)
      .put(`/api/meal-plans/${planId}`)
      .send({
        days: [
          { date: '2026-11-23T00:00:00.000Z', meals: [] },
          {
            date: '2026-11-24T00:00:00.000Z',
            meals: [{ mealType: 'Dinner', recipeId: r1._id.toString(), servings: 3 }],
          },
          { date: '2026-11-25T00:00:00.000Z', meals: [] },
          { date: '2026-11-26T00:00:00.000Z', meals: [] },
          { date: '2026-11-27T00:00:00.000Z', meals: [] },
          { date: '2026-11-28T00:00:00.000Z', meals: [] },
          { date: '2026-11-29T00:00:00.000Z', meals: [] },
        ],
      })
      .expect(200);

    // 3. Verify retrieved plan reflects moved meal
    const getPlanRes = await request(app)
      .get(`/api/meal-plans/${weekStart}`)
      .expect(200);

    const mondayMeals = getPlanRes.body.data.days[0].meals;
    const tuesdayMeals = getPlanRes.body.data.days[1].meals;

    expect(mondayMeals.length).toBe(0);
    expect(tuesdayMeals.length).toBe(1);
    expect(tuesdayMeals[0].mealType).toBe('Dinner');
    expect(tuesdayMeals[0].servings).toBe(3);
  });

  // Workflow 6: Grocery list generation, custom items, and purchase toggling
  it('Workflow 6: generates grocery list from planned recipes, adds custom items, and toggles purchased status', async () => {
    const r1 = await Recipe.create({
      title: 'Vegetable Stir-Fry',
      description: 'Quick stir-fried vegetables with soy glaze.',
      cuisine: 'Asian',
      mealType: 'Dinner',
      prepTimeMinutes: 10,
      cookTimeMinutes: 10,
      servings: 2,
      ingredients: [
        { name: 'Broccoli', quantity: 200, unit: 'g', category: 'Produce' },
        { name: 'Soy Sauce', quantity: 3, unit: 'tbsp', category: 'Pantry & Spices' },
      ],
      instructions: [{ step: 1, text: 'Stir fry vegetables.' }],
    });

    const weekStart = '2026-11-23';

    // Create meal plan with r1 scaled for 4 servings (2x default)
    await MealPlan.create({
      weekStartDate: new Date('2026-11-23T00:00:00.000Z'),
      days: [
        {
          date: new Date('2026-11-23T00:00:00.000Z'),
          meals: [{ mealType: 'Dinner', recipeId: r1._id, servings: 4 }],
        },
      ],
    });

    // 1. Generate grocery list
    const genRes = await request(app)
      .post('/api/grocery-lists/generate')
      .send({ weekStartDate: weekStart })
      .expect(201);

    expect(genRes.body.success).toBe(true);
    const list = genRes.body.data;
    expect(list.items.length).toBe(2);

    // Verify 2x scaling: Broccoli 200g * 2 = 400g
    const broccoli = list.items.find((i) => i.ingredientName === 'Broccoli');
    expect(broccoli).toBeDefined();
    expect(broccoli.quantity).toBe(400);

    // 2. Add custom item
    const addItemRes = await request(app)
      .post(`/api/grocery-lists/${list._id}/items`)
      .send({
        ingredientName: 'Almond Milk',
        quantity: 1,
        unit: 'liter',
        category: 'Dairy',
      })
      .expect(201);

    expect(addItemRes.body.data.items.some((i) => i.ingredientName === 'Almond Milk')).toBe(true);

    // 3. Toggle purchased status
    const targetItemId = broccoli._id.toString();
    const patchRes = await request(app)
      .patch(`/api/grocery-lists/${list._id}/items/${targetItemId}`)
      .send({ isPurchased: true })
      .expect(200);

    const patchedBroccoli = patchRes.body.data.items.find(
      (i) => i._id.toString() === targetItemId
    );
    expect(patchedBroccoli.isPurchased).toBe(true);
  });

  // Workflow 7: Cascading recipe deletion integrity and preservation of unrelated data
  it('Workflow 7: deletes a recipe referenced by Favorites and MealPlans, verifying clean cascade and unrelated data preservation', async () => {
    const targetRecipe = await Recipe.create({
      title: 'Target Recipe To Delete',
      description: 'Will be deleted to verify cascade.',
      cuisine: 'American',
      mealType: 'Dinner',
      prepTimeMinutes: 10,
      cookTimeMinutes: 10,
      servings: 2,
      ingredients: [{ name: 'Flour', quantity: 100, unit: 'g', category: 'Pantry & Spices' }],
      instructions: [{ step: 1, text: 'Mix.' }],
    });

    const unrelatedRecipe = await Recipe.create({
      title: 'Unrelated Recipe To Preserve',
      description: 'Should remain untouched.',
      cuisine: 'Italian',
      mealType: 'Lunch',
      prepTimeMinutes: 10,
      cookTimeMinutes: 10,
      servings: 2,
      ingredients: [{ name: 'Rice', quantity: 100, unit: 'g', category: 'Pantry & Spices' }],
      instructions: [{ step: 1, text: 'Cook.' }],
    });

    // Create favorites for both
    await Favorite.create({ recipeId: targetRecipe._id });
    await Favorite.create({ recipeId: unrelatedRecipe._id });

    // Create meal plan containing both
    await MealPlan.create({
      weekStartDate: new Date('2026-11-23T00:00:00.000Z'),
      days: [
        {
          date: new Date('2026-11-23T00:00:00.000Z'),
          meals: [
            { mealType: 'Dinner', recipeId: targetRecipe._id, servings: 2 },
            { mealType: 'Lunch', recipeId: unrelatedRecipe._id, servings: 4 },
          ],
        },
      ],
    });

    // Delete target recipe
    const deleteRes = await request(app)
      .delete(`/api/recipes/${targetRecipe._id.toString()}`)
      .expect(200);

    expect(deleteRes.body.success).toBe(true);

    // Verify target recipe deleted
    const checkRecipe = await Recipe.findById(targetRecipe._id);
    expect(checkRecipe).toBeNull();

    // Verify unrelated recipe remains
    const checkUnrelated = await Recipe.findById(unrelatedRecipe._id);
    expect(checkUnrelated).not.toBeNull();

    // Verify favorites: target favorite removed, unrelated favorite remains
    const favs = await Favorite.find();
    expect(favs.length).toBe(1);
    expect(favs[0].recipeId.toString()).toBe(unrelatedRecipe._id.toString());

    // Verify meal plan: target meal pulled from Monday, unrelated meal remains intact
    const plan = await MealPlan.findOne();
    const mondayMeals = plan.days[0].meals;
    expect(mondayMeals.length).toBe(1);
    expect(mondayMeals[0].recipeId.toString()).toBe(unrelatedRecipe._id.toString());
    expect(mondayMeals[0].servings).toBe(4);
  });

  // Workflow 8: Error envelopes, validation failures, missing resources, and empty states
  it('Workflow 8: verifies standard error envelopes, validation failures, missing resources, and empty states', async () => {
    // 1. Validation failure: missing title and description
    const validationRes = await request(app)
      .post('/api/recipes')
      .send({ cuisine: 'Italian' })
      .expect(400);

    expect(validationRes.body.success).toBe(false);
    expect(validationRes.body.error).toBeDefined();
    expect(validationRes.body.error.message).toBeDefined();

    // 2. Invalid ObjectId route parameter
    const invalidIdRes = await request(app)
      .get('/api/recipes/not-a-valid-mongodb-object-id')
      .expect(400);

    expect(invalidIdRes.body.success).toBe(false);
    expect(invalidIdRes.status).toBe(400);

    // 3. Valid ObjectId but resource not found
    const fakeId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await request(app)
      .get(`/api/recipes/${fakeId}`)
      .expect(404);

    expect(notFoundRes.body.success).toBe(false);
    expect(notFoundRes.status).toBe(404);

    // 4. Empty state for unpopulated grocery list
    const emptyGroceryRes = await request(app)
      .get('/api/grocery-lists/2099-01-01')
      .expect(200);
    expect(emptyGroceryRes.body.success).toBe(true);
    expect(emptyGroceryRes.body.data).toBeNull();

    // 5. Generating grocery list for non-existent meal plan returns 404
    await request(app)
      .post('/api/grocery-lists/generate')
      .send({ weekStartDate: '2099-01-01' })
      .expect(404);

    // 6. Completely unmapped endpoint
    const unmappedRes = await request(app)
      .get('/api/completely-unknown-endpoint')
      .expect(404);

    expect(unmappedRes.body.success).toBe(false);
    expect(unmappedRes.status).toBe(404);
  });
});
