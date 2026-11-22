import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from './testUtils';
import HomePage from '../pages/HomePage';
import * as recipeService from '../services/recipeService';
import * as mealPlanService from '../services/mealPlanService';
import { mockRecipes, mockMealPlan } from './fixtures/mockData';

vi.mock('../services/recipeService');
vi.mock('../services/mealPlanService');
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

describe('HomePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner while dashboard data is fetching', () => {
    recipeService.getRecipes.mockReturnValue(new Promise(() => {}));
    mealPlanService.getMealPlan.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<HomePage />);
    expect(screen.getByText(/Loading your culinary dashboard/i)).toBeInTheDocument();
  });

  it('renders dashboard hero, recipe sections, and scheduled meals when data is loaded', async () => {
    recipeService.getRecipes.mockResolvedValue({
      success: true,
      data: mockRecipes,
      meta: { total: mockRecipes.length },
    });
    mealPlanService.getMealPlan.mockResolvedValue({
      success: true,
      data: mockMealPlan,
    });

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading your culinary dashboard/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Plan Better, Cook Smarter, Eat Fresh.')).toBeInTheDocument();

    // Check CTAs
    expect(screen.getByRole('button', { name: /Explore Recipes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Meal Planner/i })).toBeInTheDocument();

    // Check recipe card titles
    const pastaTitles = screen.getAllByText('Creamy Garlic Tuscan Pasta');
    expect(pastaTitles.length).toBeGreaterThan(0);
    const saladTitles = screen.getAllByText('Fresh Garden Salad Bowl');
    expect(saladTitles.length).toBeGreaterThan(0);

    // Check planner section
    expect(screen.getByText(/This Week's Meal Schedule/i)).toBeInTheDocument();
  });

  it('renders empty meal plan prompt when no meals are scheduled', async () => {
    recipeService.getRecipes.mockResolvedValue({
      success: true,
      data: mockRecipes,
      meta: { total: mockRecipes.length },
    });
    mealPlanService.getMealPlan.mockResolvedValue({
      success: true,
      data: { days: [] },
    });

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('No meals scheduled for this week yet')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Start Planning Meals/i })).toBeInTheDocument();
  });

  it('renders error banner when loading dashboard fails', async () => {
    recipeService.getRecipes.mockImplementation(() => {
      throw new Error('Network error loading recipes');
    });

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Network error loading recipes|Failed to load home dashboard/i)).toBeInTheDocument();
    });
  });
});
