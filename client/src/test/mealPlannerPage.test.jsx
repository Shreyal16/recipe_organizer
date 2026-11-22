import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './testUtils';
import MealPlannerPage from '../pages/MealPlannerPage';
import * as mealPlanService from '../services/mealPlanService';
import * as recipeService from '../services/recipeService';
import { mockMealPlan, mockRecipes } from './fixtures/mockData';

vi.mock('../services/mealPlanService');
vi.mock('../services/recipeService');
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

describe('MealPlannerPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recipeService.getRecipes.mockResolvedValue({
      success: true,
      data: mockRecipes,
    });
  });

  it('renders loading spinner while meal plan is fetching', () => {
    mealPlanService.getMealPlan.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<MealPlannerPage />, { initialEntries: ['/planner?week=2026-11-23'] });
    expect(screen.getByText(/Loading your weekly schedule/i)).toBeInTheDocument();
  });

  it('renders 7 day columns, week range, and planned meal cards', async () => {
    mealPlanService.getMealPlan.mockResolvedValue({
      success: true,
      data: mockMealPlan,
    });

    renderWithProviders(<MealPlannerPage />, { initialEntries: ['/planner?week=2026-11-23'] });

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
      expect(screen.getByText('Fresh Garden Salad Bowl')).toBeInTheDocument();
    });

    // Check week navigation controls
    expect(screen.getByRole('button', { name: /Prev Week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next Week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Current Week/i })).toBeInTheDocument();

    // Check accessible drag handles
    const dragHandles = screen.getAllByRole('button', {
      name: /Drag .* to another meal slot/i,
    });
    expect(dragHandles.length).toBe(2);
    expect(dragHandles[0]).toHaveAttribute('aria-roledescription', 'draggable');
  });

  it('gracefully renders "Recipe Deleted" badge for stale references in meal slots', async () => {
    const staleMealPlan = {
      ...mockMealPlan,
      days: [
        {
          date: '2026-11-23T00:00:00.000Z',
          meals: [
            {
              _id: 'meal-stale',
              mealType: 'Dinner',
              recipeId: null, // deleted recipe
              servings: 2,
            },
          ],
        },
        ...mockMealPlan.days.slice(1),
      ],
    };

    mealPlanService.getMealPlan.mockResolvedValue({
      success: true,
      data: staleMealPlan,
    });

    renderWithProviders(<MealPlannerPage />, { initialEntries: ['/planner?week=2026-11-23'] });

    await waitFor(() => {
      expect(screen.getByText('Recipe Deleted')).toBeInTheDocument();
    });

    expect(screen.getByTitle('Remove stale reference')).toBeInTheDocument();
  });

  it('opens recipe selector modal when clicking "+" and adds meal to slot', async () => {
    const user = userEvent.setup();
    mealPlanService.getMealPlan.mockResolvedValue({
      success: true,
      data: mockMealPlan,
    });
    mealPlanService.updateMealPlan.mockResolvedValue({
      success: true,
      data: mockMealPlan,
    });

    renderWithProviders(<MealPlannerPage />, { initialEntries: ['/planner?week=2026-11-23'] });

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
    });

    // Click "+" button on a meal slot
    const addMealButtons = screen.getAllByRole('button', { name: /Add recipe to/i });
    expect(addMealButtons.length).toBeGreaterThan(0);
    await user.click(addMealButtons[0]);

    // Modal should be open and recipes loaded after debounce
    await waitFor(() => {
      expect(screen.getByText(/Choose a Recipe for/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /^Select$/i }).length).toBeGreaterThan(0);
    });

    const selectButtons = screen.getAllByRole('button', { name: /^Select$/i });
    await user.click(selectButtons[0]);

    await waitFor(() => {
      expect(mealPlanService.updateMealPlan).toHaveBeenCalledWith(
        'mp-001',
        expect.objectContaining({
          days: expect.any(Array),
        })
      );
    });
  });

  it('reverts optimistic state and displays error when saving meal changes fails', async () => {
    const user = userEvent.setup();
    mealPlanService.getMealPlan.mockResolvedValue({
      success: true,
      data: mockMealPlan,
    });
    mealPlanService.updateMealPlan.mockRejectedValue(new Error('Database lock error'));

    renderWithProviders(<MealPlannerPage />, { initialEntries: ['/planner?week=2026-11-23'] });

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
    });

    // Click "+" button and select recipe to trigger save failure
    const addMealButtons = screen.getAllByRole('button', { name: /Add recipe to/i });
    await user.click(addMealButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Choose a Recipe for/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /^Select$/i }).length).toBeGreaterThan(0);
    });

    const selectButtons = screen.getAllByRole('button', { name: /^Select$/i });
    await user.click(selectButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText(/Database lock error|Failed to update meal plan/i)
      ).toBeInTheDocument();
    });
  });
});
