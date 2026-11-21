export const DEFAULT_RECIPE_IMAGE =
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export const CUISINES = [
  'Indian',
  'Italian',
  'Mexican',
  'Asian',
  'Mediterranean',
  'American',
  'Middle Eastern',
  'French',
  'Other',
];

export const DIETARY_TAGS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'High-Protein',
  'Low-Carb',
  'Keto',
  'Nut-Free',
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'prepTime', label: 'Fastest Prep' },
  { value: 'title', label: 'Alphabetical (A - Z)' },
  { value: 'popularity', label: 'Most Popular' },
];

export const GROCERY_CATEGORIES = [
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Bakery',
  'Pantry & Spices',
  'Pantry & General',
  'Beverages',
  'Other',
];

export default {
  DEFAULT_RECIPE_IMAGE,
  MEAL_TYPES,
  CUISINES,
  DIETARY_TAGS,
  DIFFICULTIES,
  SORT_OPTIONS,
  GROCERY_CATEGORIES,
};
