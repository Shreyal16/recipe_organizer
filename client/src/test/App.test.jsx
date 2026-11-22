import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

vi.mock('../services/favoriteService', () => ({
  getFavorites: vi.fn().mockResolvedValue({ success: true, data: [] }),
  addFavorite: vi.fn().mockResolvedValue({ success: true, data: {} }),
  removeFavorite: vi.fn().mockResolvedValue({ success: true, data: {} }),
  default: {
    getFavorites: vi.fn().mockResolvedValue({ success: true, data: [] }),
    addFavorite: vi.fn().mockResolvedValue({ success: true, data: {} }),
    removeFavorite: vi.fn().mockResolvedValue({ success: true, data: {} }),
  },
}));

vi.mock('../services/recipeService', () => ({
  getRecipes: vi.fn().mockResolvedValue({ success: true, data: [], meta: { total: 0 } }),
  getRecipe: vi.fn().mockResolvedValue({ success: true, data: {} }),
  default: {
    getRecipes: vi.fn().mockResolvedValue({ success: true, data: [], meta: { total: 0 } }),
    getRecipe: vi.fn().mockResolvedValue({ success: true, data: {} }),
  },
}));

vi.mock('../services/mealPlanService', () => ({
  getMealPlan: vi.fn().mockResolvedValue({ success: true, data: null }),
  default: {
    getMealPlan: vi.fn().mockResolvedValue({ success: true, data: null }),
  },
}));

describe('Frontend Foundation Test', () => {
  it('renders application brand and navigation', async () => {
    render(<App />);
    const brandElements = await screen.findAllByText(/Recipe Organizer/i);
    expect(brandElements.length).toBeGreaterThan(0);
  });
});


