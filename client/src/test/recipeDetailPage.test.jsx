import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from './testUtils';
import RecipeDetailPage from '../pages/RecipeDetailPage';
import * as recipeService from '../services/recipeService';
import * as favoriteService from '../services/favoriteService';
import { mockRecipes } from './fixtures/mockData';

vi.mock('../services/recipeService');
vi.mock('../services/favoriteService');

const singleRecipe = {
  ...mockRecipes[0],
  prepTimeMinutes: 15,
  cookTimeMinutes: 20,
  servings: 4,
  mealType: 'Dinner',
  instructions: [
    { step: 1, text: 'Boil water and cook penne according to package instructions.' },
    { step: 2, text: 'Saute minced garlic in olive oil, then add cream and spinach.' },
  ],
};

function renderDetail(recipeId = 'rec-001') {
  return renderWithProviders(
    <Routes>
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />
    </Routes>,
    { initialEntries: [`/recipes/${recipeId}`] }
  );
}

describe('RecipeDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    favoriteService.getFavorites.mockResolvedValue({ success: true, data: [] });
    favoriteService.addFavorite.mockResolvedValue({ success: true, data: {} });
    favoriteService.removeFavorite.mockResolvedValue({ success: true, data: {} });
  });

  it('renders loading spinner while recipe is fetching', () => {
    recipeService.getRecipe.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(screen.getByText(/Loading recipe details/i)).toBeInTheDocument();
  });

  it('renders error banner when recipe fails to load', async () => {
    recipeService.getRecipe.mockRejectedValue(new Error('Recipe not found'));
    renderDetail('unknown-id');

    await waitFor(() => {
      expect(screen.getByText(/Recipe not found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Recipes/i })).toBeInTheDocument();
    });
  });

  it('renders full recipe details, ingredients, and instructions', async () => {
    recipeService.getRecipe.mockResolvedValue({
      success: true,
      data: singleRecipe,
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
    });

    expect(screen.getByText(/15 mins/i)).toBeInTheDocument();
    expect(screen.getByText(/20 mins/i)).toBeInTheDocument();
    expect(screen.getByText(/4 people/i)).toBeInTheDocument();

    // Ingredients
    expect(screen.getByText('Penne Pasta')).toBeInTheDocument();
    expect(screen.getByText('Heavy Cream')).toBeInTheDocument();
    expect(screen.getByText('Garlic')).toBeInTheDocument();

    // Instructions
    expect(screen.getByText('Boil water and cook penne according to package instructions.')).toBeInTheDocument();
  });

  it('toggles ingredient checklist items when clicked', async () => {
    const user = userEvent.setup();
    recipeService.getRecipe.mockResolvedValue({
      success: true,
      data: singleRecipe,
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Penne Pasta')).toBeInTheDocument();
    });

    const pastaItem = screen.getByText('Penne Pasta').closest('li');
    expect(pastaItem).not.toHaveClass('line-through');

    // Click to cross off
    await user.click(pastaItem);
    expect(pastaItem).toHaveClass('line-through');

    // Click again to uncheck
    await user.click(pastaItem);
    expect(pastaItem).not.toHaveClass('line-through');
  });

  it('toggles favorite status when clicking favorite button', async () => {
    const user = userEvent.setup();
    recipeService.getRecipe.mockResolvedValue({
      success: true,
      data: singleRecipe,
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
    });

    const favButton = screen.getByRole('button', { name: /Add to Favorites/i });
    await user.click(favButton);

    await waitFor(() => {
      expect(favoriteService.addFavorite).toHaveBeenCalledWith('rec-001');
    });
  });

  it('opens delete confirm dialog and triggers recipe deletion', async () => {
    const user = userEvent.setup();
    recipeService.getRecipe.mockResolvedValue({
      success: true,
      data: singleRecipe,
    });
    recipeService.deleteRecipe.mockResolvedValue({
      success: true,
      data: { message: 'Recipe deleted' },
    });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /^Delete$/i });
    await user.click(deleteBtn);

    // Dialog should open
    expect(screen.getByText(/Are you sure you want to permanently delete/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Yes, Delete/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(recipeService.deleteRecipe).toHaveBeenCalledWith('rec-001');
    });
  });
});
