import mongoose from 'mongoose';

/**
 * Standard unit normalization dictionary.
 */
const UNIT_MAP = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  pound: 'lb',
  pounds: 'lb',
  piece: 'piece',
  pieces: 'piece',
  pcs: 'piece',
  clove: 'clove',
  cloves: 'clove',
  pinch: 'pinch',
  pinches: 'pinch',
  slice: 'slice',
  slices: 'slice',
  can: 'can',
  cans: 'can',
};

/**
 * Guess ingredient grocery category based on common keywords.
 */
export const categorizeIngredient = (name) => {
  const lower = name.toLowerCase();

  const produceKeywords = [
    'tomato', 'onion', 'garlic', 'ginger', 'potato', 'chili', 'spinach',
    'coriander', 'cilantro', 'mint', 'lemon', 'lime', 'bell pepper',
    'carrot', 'broccoli', 'avocado', 'mushroom', 'cucumber', 'lettuce',
    'cabbage', 'basil', 'parsley', 'apple', 'banana', 'mango', 'zucchini',
    'eggplant', 'scallion', 'shallot', 'cauliflower', 'kale', 'berry', 'berries'
  ];

  const dairyKeywords = [
    'milk', 'cheese', 'paneer', 'butter', 'ghee', 'yogurt', 'curd',
    'cream', 'mozzarella', 'parmesan', 'cheddar', 'ricotta', 'egg', 'eggs'
  ];

  const meatKeywords = [
    'chicken', 'mutton', 'beef', 'pork', 'fish', 'prawn', 'shrimp',
    'salmon', 'tuna', 'turkey', 'lamb', 'bacon', 'ham'
  ];

  const bakeryKeywords = [
    'bread', 'bun', 'bagel', 'tortilla', 'pita', 'naan', 'croissant',
    'pizza base', 'wrap'
  ];

  const pantryKeywords = [
    'oil', 'olive oil', 'salt', 'pepper', 'sugar', 'flour', 'rice',
    'pasta', 'noodle', 'sauce', 'vinegar', 'soy sauce', 'cumin',
    'turmeric', 'coriander powder', 'garam masala', 'cinnamon', 'cardamom',
    'chili powder', 'oregano', 'paprika', 'clove', 'mustard', 'baking powder',
    'baking soda', 'vanilla', 'honey', 'maple syrup', 'beans', 'lentil', 'chickpea'
  ];

  if (produceKeywords.some((k) => lower.includes(k))) return 'Produce';
  if (dairyKeywords.some((k) => lower.includes(k))) return 'Dairy & Eggs';
  if (meatKeywords.some((k) => lower.includes(k))) return 'Meat & Seafood';
  if (bakeryKeywords.some((k) => lower.includes(k))) return 'Bakery';
  if (pantryKeywords.some((k) => lower.includes(k))) return 'Pantry & Spices';

  return 'Pantry & General';
};

/**
 * Normalizes a unit string.
 */
export const normalizeUnit = (unit) => {
  if (!unit || typeof unit !== 'string') return '';
  const clean = unit.trim().toLowerCase();
  return UNIT_MAP[clean] || clean;
};

/**
 * Deterministically aggregates ingredients from an array of ingredient items.
 * If units match (or are normalized to identical units), adds quantities.
 * If units differ or are incompatible (e.g. 500 ml vs 1 cup), keeps them as separate grocery items.
 *
 * @param {Array<{name: string, quantity: number|null, unit: string, servingsMultiplier?: number}>} ingredients
 * @returns {Array<{_id: mongoose.Types.ObjectId, ingredientName: string, quantity: number|null, unit: string, category: string, isPurchased: boolean}>}
 */
export const aggregateIngredients = (ingredients = []) => {
  const map = new Map();

  for (const item of ingredients) {
    if (!item || !item.name) continue;

    const trimmedName = item.name.trim();
    const normalizedNameKey = trimmedName.toLowerCase();
    const normalizedUnitKey = normalizeUnit(item.unit);
    const multiplier = typeof item.servingsMultiplier === 'number' && item.servingsMultiplier > 0 ? item.servingsMultiplier : 1;

    // Composite key: name + unit so incompatible units are kept distinct
    const key = `${normalizedNameKey}:::${normalizedUnitKey}`;

    const validQty = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity >= 0
      ? item.quantity * multiplier
      : null;

    if (map.has(key)) {
      const existing = map.get(key);
      if (existing.quantity !== null && validQty !== null) {
        existing.quantity = Math.round((existing.quantity + validQty) * 100) / 100;
      } else if (existing.quantity === null && validQty !== null) {
        existing.quantity = Math.round(validQty * 100) / 100;
      }
    } else {
      map.set(key, {
        _id: new mongoose.Types.ObjectId(), // Stable subdocument ObjectId
        ingredientName: trimmedName,
        quantity: validQty !== null ? Math.round(validQty * 100) / 100 : null,
        unit: normalizedUnitKey,
        category: categorizeIngredient(trimmedName),
        isPurchased: false,
      });
    }
  }

  return Array.from(map.values());
};

export default {
  aggregateIngredients,
  categorizeIngredient,
  normalizeUnit,
};
