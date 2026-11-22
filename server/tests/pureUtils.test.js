import { describe, it, expect } from 'vitest';
import {
  getMondayUTC,
  getWeekDatesUTC,
  formatISODate,
} from '../src/utils/dateUtils.js';
import {
  normalizeUnit,
  categorizeIngredient,
  aggregateIngredients,
} from '../src/utils/ingredientAggregator.js';

describe('Backend Pure Utilities', () => {
  describe('dateUtils', () => {
    it('normalizes any weekday to Monday UTC at 00:00:00.000Z', () => {
      // Wednesday Nov 25, 2026
      const wednesday = '2026-11-25T14:30:00.000Z';
      const monday = getMondayUTC(wednesday);

      expect(monday.toISOString()).toBe('2026-11-23T00:00:00.000Z');
      expect(monday.getUTCDay()).toBe(1); // Monday is 1
    });

    it('generates exact 7 days Monday to Sunday in UTC', () => {
      const monday = new Date('2026-11-23T00:00:00.000Z');
      const week = getWeekDatesUTC(monday);

      expect(week.length).toBe(7);
      expect(week[0].toISOString()).toBe('2026-11-23T00:00:00.000Z');
      expect(week[6].toISOString()).toBe('2026-11-29T00:00:00.000Z');
    });

    it('throws descriptive error on invalid date inputs', () => {
      expect(() => getMondayUTC('invalid-date')).toThrow('Invalid date provided');
    });

    it('formats date to ISO YYYY-MM-DD string', () => {
      const d = new Date('2026-11-23T15:00:00.000Z');
      expect(formatISODate(d)).toBe('2026-11-23');
    });
  });

  describe('ingredientAggregator', () => {
    it('normalizes common measurement units to standard plural/singular terms', () => {
      expect(normalizeUnit('tablespoon')).toBe('tbsp');
      expect(normalizeUnit('tablespoons')).toBe('tbsp');
      expect(normalizeUnit('teaspoon')).toBe('tsp');
      expect(normalizeUnit('teaspoons')).toBe('tsp');
      expect(normalizeUnit('grams')).toBe('g');
      expect(normalizeUnit('kilogram')).toBe('kg');
      expect(normalizeUnit('cups')).toBe('cup');
      expect(normalizeUnit('pieces')).toBe('piece');
    });

    it('categorizes ingredients into logical grocery aisles', () => {
      expect(categorizeIngredient('tomato')).toBe('Produce');
      expect(categorizeIngredient('bell pepper')).toBe('Produce');
      expect(categorizeIngredient('onion')).toBe('Produce');
      expect(categorizeIngredient('garlic')).toBe('Produce');

      expect(categorizeIngredient('chicken breast')).toBe('Meat & Seafood');
      expect(categorizeIngredient('salmon')).toBe('Meat & Seafood');

      expect(categorizeIngredient('heavy cream')).toBe('Dairy & Eggs');
      expect(categorizeIngredient('butter')).toBe('Dairy & Eggs');
      expect(categorizeIngredient('cheddar cheese')).toBe('Dairy & Eggs');

      expect(categorizeIngredient('sourdough bread')).toBe('Bakery');
      expect(categorizeIngredient('tortillas')).toBe('Bakery');

      expect(categorizeIngredient('olive oil')).toBe('Pantry & Spices');
      expect(categorizeIngredient('ground cumin')).toBe('Pantry & Spices');
    });

    it('aggregates and scales matching ingredients across multiple recipes', () => {
      const rawIngredients = [
        // Recipe 1: 200g chicken (multiplier 2x = 400g)
        { name: 'Chicken Breast', quantity: 200, unit: 'g', servingsMultiplier: 2 },
        // Recipe 2: 300g chicken (multiplier 1x = 300g)
        { name: 'chicken breast', quantity: 300, unit: 'g', servingsMultiplier: 1 },
        // Recipe 3: 2 tbsp olive oil (multiplier 1x = 2 tbsp)
        { name: 'Olive Oil', quantity: 2, unit: 'tbsp', servingsMultiplier: 1 },
        // Recipe 4: 1 tbsp olive oil (multiplier 1x = 1 tbsp)
        { name: 'olive oil', quantity: 1, unit: 'tbsp', servingsMultiplier: 1 },
      ];

      const aggregated = aggregateIngredients(rawIngredients);

      expect(aggregated.length).toBe(2);

      const chicken = aggregated.find((i) => i.ingredientName.toLowerCase().includes('chicken'));
      expect(chicken).toBeDefined();
      expect(chicken.quantity).toBe(700); // 400 + 300
      expect(chicken.unit).toBe('g');
      expect(chicken.category).toBe('Meat & Seafood');

      const oil = aggregated.find((i) => i.ingredientName.toLowerCase().includes('oil'));
      expect(oil).toBeDefined();
      expect(oil.quantity).toBe(3); // 2 + 1
      expect(oil.unit).toBe('tbsp');
    });

    it('handles empty ingredient lists without crashing', () => {
      const aggregated = aggregateIngredients([]);
      expect(aggregated).toEqual([]);
    });
  });
});
