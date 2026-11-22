export const mockRecipes = [
  {
    _id: 'rec-001',
    title: 'Creamy Garlic Tuscan Pasta',
    description: 'Delicious creamy garlic pasta with sun-dried tomatoes and spinach.',
    cuisine: 'Italian',
    difficulty: 'Medium',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    calories: 520,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d628102d',
    tags: ['Pasta', 'Comfort Food', 'Vegetarian'],
    ingredients: [
      { name: 'Penne Pasta', quantity: 300, unit: 'grams', category: 'Pantry & Spices' },
      { name: 'Heavy Cream', quantity: 200, unit: 'ml', category: 'Dairy' },
      { name: 'Garlic', quantity: 4, unit: 'cloves', category: 'Produce' },
      { name: 'Baby Spinach', quantity: 100, unit: 'grams', category: 'Produce' },
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Boil water and cook penne according to package instructions.' },
      { stepNumber: 2, instruction: 'Saute minced garlic in olive oil, then add cream and spinach.' },
      { stepNumber: 3, instruction: 'Toss pasta in sauce and serve hot.' },
    ],
    isFavorite: true,
  },
  {
    _id: 'rec-002',
    title: 'Fresh Garden Salad Bowl',
    description: 'Crisp green salad with cucumbers, cherry tomatoes, and lemon vinaigrette.',
    cuisine: 'Mediterranean',
    difficulty: 'Easy',
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    calories: 180,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    tags: ['Salad', 'Healthy', 'Low Calorie', 'Vegetarian'],
    ingredients: [
      { name: 'Romaine Lettuce', quantity: 1, unit: 'head', category: 'Produce' },
      { name: 'Cherry Tomatoes', quantity: 150, unit: 'grams', category: 'Produce' },
      { name: 'Cucumber', quantity: 1, unit: 'piece', category: 'Produce' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry & Spices' },
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Chop lettuce, slice cucumber, and halve cherry tomatoes.' },
      { stepNumber: 2, instruction: 'Whisk olive oil and lemon juice, toss over salad.' },
    ],
    isFavorite: false,
  },
  {
    _id: 'rec-003',
    title: 'Spicy Black Bean Tacos',
    description: 'Quick Mexican tacos packed with seasoned black beans and avocado.',
    cuisine: 'Mexican',
    difficulty: 'Easy',
    prepTime: 10,
    cookTime: 10,
    servings: 3,
    calories: 360,
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47',
    tags: ['Mexican', 'Quick', 'Vegan'],
    ingredients: [
      { name: 'Corn Tortillas', quantity: 6, unit: 'piece', category: 'Pantry & Spices' },
      { name: 'Black Beans', quantity: 1, unit: 'can', category: 'Pantry & Spices' },
      { name: 'Avocado', quantity: 1, unit: 'piece', category: 'Produce' },
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Warm black beans with taco seasoning.' },
      { stepNumber: 2, instruction: 'Warm tortillas and fill with beans, avocado slices, and salsa.' },
    ],
    isFavorite: false,
  },
];

export const mockFavorites = [
  {
    _id: 'fav-001',
    recipeId: mockRecipes[0],
    createdAt: '2026-11-20T10:00:00.000Z',
  },
];

export const mockMealPlan = {
  _id: 'mp-001',
  weekStartDate: '2026-11-23T00:00:00.000Z',
  days: [
    {
      date: '2026-11-23T00:00:00.000Z',
      meals: [
        {
          _id: 'meal-001',
          mealType: 'Dinner',
          servings: 4,
          recipeId: mockRecipes[0],
        },
      ],
    },
    {
      date: '2026-11-24T00:00:00.000Z',
      meals: [
        {
          _id: 'meal-002',
          mealType: 'Lunch',
          servings: 2,
          recipeId: mockRecipes[1],
        },
      ],
    },
    { date: '2026-11-25T00:00:00.000Z', meals: [] },
    { date: '2026-11-26T00:00:00.000Z', meals: [] },
    { date: '2026-11-27T00:00:00.000Z', meals: [] },
    { date: '2026-11-28T00:00:00.000Z', meals: [] },
    { date: '2026-11-29T00:00:00.000Z', meals: [] },
  ],
};

export const mockGroceryList = {
  _id: 'gl-001',
  weekStartDate: '2026-11-23T00:00:00.000Z',
  items: [
    {
      _id: 'item-001',
      ingredientName: 'Baby Spinach',
      name: 'Baby Spinach',
      quantity: 100,
      unit: 'grams',
      category: 'Produce',
      isPurchased: false,
      purchased: false,
    },
    {
      _id: 'item-002',
      ingredientName: 'Heavy Cream',
      name: 'Heavy Cream',
      quantity: 200,
      unit: 'ml',
      category: 'Dairy',
      isPurchased: true,
      purchased: true,
    },
    {
      _id: 'item-003',
      ingredientName: 'Penne Pasta',
      name: 'Penne Pasta',
      quantity: 300,
      unit: 'grams',
      category: 'Pantry & Spices',
      isPurchased: false,
      purchased: false,
    },
  ],
};

export const mockInsights = {
  stats: {
    totalRecipes: 24,
    totalMealPlans: 3,
    totalFavorites: 5,
    plannedMealsCount: 12,
  },
  charts: {
    popularMealTypes: [
      { name: 'Dinner', count: 8 },
      { name: 'Lunch', count: 4 },
      { name: 'Breakfast', count: 2 },
    ],
    cuisineDistribution: [
      { name: 'Italian', count: 8 },
      { name: 'Mexican', count: 6 },
      { name: 'Mediterranean', count: 5 },
    ],
    commonIngredients: [
      { name: 'Garlic', count: 12 },
      { name: 'Olive Oil', count: 10 },
      { name: 'Salt', count: 8 },
    ],
  },
  recommendations: [
    {
      recipe: mockRecipes[0],
      score: 85,
      matchedIngredients: ['Garlic', 'Olive Oil'],
      missingIngredients: ['Heavy Cream', 'Baby Spinach'],
      matchPercentage: 50,
      reason: 'Matches your Italian cuisine preference and uses 2 pantry ingredients.',
    },
  ],
};

export const mockPreferences = {
  preferredCuisines: ['Italian', 'Mexican'],
  dietaryRestrictions: ['Vegetarian'],
  pantryIngredients: ['Garlic', 'Olive Oil', 'Pasta', 'Tomatoes'],
};
