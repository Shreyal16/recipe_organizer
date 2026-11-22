import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './testUtils';
import InsightsPage from '../pages/InsightsPage';
import * as insightsService from '../services/insightsService';
import * as preferenceService from '../services/preferenceService';
import { mockRecipes } from './fixtures/mockData';

vi.mock('../services/insightsService');
vi.mock('../services/preferenceService');
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

const testInsightsData = {
  preferredCuisines: [
    { cuisine: 'Italian', count: 8, percentage: 60 },
    { cuisine: 'Mexican', count: 4, percentage: 30 },
  ],
  popularMealTypes: [
    { mealType: 'Dinner', count: 12, percentage: 70 },
    { mealType: 'Lunch', count: 5, percentage: 30 },
  ],
  commonIngredients: [
    { ingredient: 'garlic', count: 15, percentage: 80 },
    { ingredient: 'olive oil', count: 12, percentage: 65 },
  ],
  frequentlySavedRecipes: [
    {
      ...mockRecipes[0],
      favoriteCount: 5,
    },
  ],
  recommendations: [
    {
      recipe: mockRecipes[0],
      matchScore: 90,
      matchedIngredients: ['garlic', 'olive oil'],
      missingIngredients: ['heavy cream'],
      matchPercentage: 67,
      reasons: ['Matches your Italian cuisine preference and uses 2 pantry items.'],
    },
  ],
};

const testPreferencesData = {
  preferredCuisines: ['Italian'],
  dietaryPreferences: ['Vegetarian'],
  pantryIngredients: ['Garlic', 'Olive Oil', 'Pasta'],
};

describe('InsightsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preferenceService.getPreferences.mockResolvedValue({
      success: true,
      data: testPreferencesData,
    });
    preferenceService.updatePreferences.mockResolvedValue({
      success: true,
      data: testPreferencesData,
    });
  });

  it('renders loading spinner while insights data is computing', () => {
    insightsService.getInsights.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<InsightsPage />);
    expect(
      screen.getByText(/Computing personalized culinary insights/i)
    ).toBeInTheDocument();
  });

  it('renders insights charts, titles, and saved recipes when loaded', async () => {
    insightsService.getInsights.mockResolvedValue({
      success: true,
      data: testInsightsData,
    });

    renderWithProviders(<InsightsPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Recipe Insights & Smart Personalization')
      ).toBeInTheDocument();
    });

    // Chart titles
    expect(screen.getByText('Preferred Cuisines Distribution')).toBeInTheDocument();
    expect(screen.getByText('Recipe Collection by Meal Type')).toBeInTheDocument();
    expect(screen.getByText('Most Common Ingredients')).toBeInTheDocument();

    // Frequently saved recipe
    expect(screen.getByText('Your Saved Recipes')).toBeInTheDocument();
    expect(screen.getAllByText('Creamy Garlic Tuscan Pasta').length).toBeGreaterThan(0);
  });

  it('manages pantry ingredient chips: adding, duplicate prevention, and deletion', async () => {
    const user = userEvent.setup();
    insightsService.getInsights.mockResolvedValue({
      success: true,
      data: testInsightsData,
    });

    renderWithProviders(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('Pantry Ingredients & Cuisine Preferences')).toBeInTheDocument();
    });

    // Check existing chips
    expect(screen.getByText('Garlic')).toBeInTheDocument();
    expect(screen.getByText('Olive Oil')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();

    // Try adding duplicate ingredient (case-insensitive)
    const pantryInput = screen.getByPlaceholderText(/e\.g\. olive oil/i);
    await user.type(pantryInput, 'garlic');
    const addBtn = screen.getByRole('button', { name: /^Add$/i });
    await user.click(addBtn);

    expect(screen.getByText(/"garlic" is already in your pantry\./i)).toBeInTheDocument();

    // Add unique ingredient
    await user.clear(pantryInput);
    await user.type(pantryInput, 'Black Pepper');
    await user.click(addBtn);

    expect(screen.getByText('Black Pepper')).toBeInTheDocument();

    // Remove an ingredient chip
    const pastaChip = screen.getByText('Pasta');
    const deletePastaBtn = pastaChip.closest('span').querySelector('button');
    if (deletePastaBtn) {
      await user.click(deletePastaBtn);
      expect(screen.queryByText('Pasta')).not.toBeInTheDocument();
    }

    // Save preferences
    const saveBtn = screen.getByRole('button', { name: /Save Preferences/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(preferenceService.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          pantryIngredients: expect.arrayContaining(['Garlic', 'Olive Oil', 'Black Pepper']),
        })
      );
    });
  });

  it('renders error banner when insights service fails to load', async () => {
    insightsService.getInsights.mockRejectedValue(new Error('Calculation failed'));
    renderWithProviders(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Calculation failed/i)).toBeInTheDocument();
    });
  });
});
