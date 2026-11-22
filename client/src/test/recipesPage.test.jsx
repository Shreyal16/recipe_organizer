import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './testUtils';
import RecipesPage from '../pages/RecipesPage';
import * as recipeService from '../services/recipeService';
import * as favoriteService from '../services/favoriteService';
import { mockRecipes } from './fixtures/mockData';

vi.mock('../services/recipeService');
vi.mock('../services/favoriteService');

describe('RecipesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    favoriteService.getFavorites.mockResolvedValue({
      success: true,
      data: [{ _id: 'fav-1', recipeId: mockRecipes[0] }],
    });
    favoriteService.addFavorite.mockResolvedValue({ success: true, data: {} });
    favoriteService.removeFavorite.mockResolvedValue({ success: true, data: {} });
  });

  it('renders loading spinner while recipes are fetching', () => {
    recipeService.getRecipes.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<RecipesPage />);
    expect(screen.getByText(/Loading delicious recipes/i)).toBeInTheDocument();
  });

  it('renders recipe cards with titles and favorite buttons', async () => {
    recipeService.getRecipes.mockResolvedValue({
      success: true,
      data: mockRecipes,
      meta: { page: 1, limit: 12, total: 3, totalPages: 1 },
    });

    renderWithProviders(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
      expect(screen.getByText('Fresh Garden Salad Bowl')).toBeInTheDocument();
      expect(screen.getByText('Spicy Black Bean Tacos')).toBeInTheDocument();
    });

    // Check favorite button on card
    const favButtons = screen.getAllByRole('button', { name: /favorites/i });
    expect(favButtons.length).toBeGreaterThan(0);
  });

  it('triggers search when text is entered into the search input', async () => {
    const user = userEvent.setup();
    recipeService.getRecipes.mockResolvedValue({
      success: true,
      data: mockRecipes,
      meta: { page: 1, limit: 12, total: 3, totalPages: 1 },
    });

    renderWithProviders(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search recipes\.\.\./i);
    await user.type(searchInput, 'pasta');

    await waitFor(() => {
      expect(recipeService.getRecipes).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'pasta' })
      );
    });
  });

  it('displays empty state when no recipes match query', async () => {
    recipeService.getRecipes.mockResolvedValue({
      success: true,
      data: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
    });

    renderWithProviders(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText(/No recipes match your criteria/i)).toBeInTheDocument();
    });
  });

  it('validates required fields and allows adding/removing ingredients in RecipeFormModal', async () => {
    const user = userEvent.setup();
    recipeService.getRecipes.mockResolvedValue({
      success: true,
      data: mockRecipes,
      meta: { page: 1, limit: 12, total: 3, totalPages: 1 },
    });
    recipeService.createRecipe.mockResolvedValue({
      success: true,
      data: { _id: 'rec-new', title: 'New Recipe' },
    });

    renderWithProviders(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
    });

    // Open Create Recipe modal
    const createBtn = screen.getByRole('button', { name: /Add Recipe/i });
    await user.click(createBtn);

    expect(screen.getByText('Create New Recipe')).toBeInTheDocument();

    // Try submitting without title to verify validation
    const submitBtn = screen.getByRole('button', { name: /Create Recipe/i });
    await user.click(submitBtn);

    expect(screen.getByText('Recipe title is required')).toBeInTheDocument();

    // Type title and description
    const titleInput = screen.getByPlaceholderText(/e\.g\. Creamy Paneer Butter Masala/i);
    await user.type(titleInput, 'Homemade Margherita Pizza');

    const descInput = screen.getByPlaceholderText(/A brief flavorful overview/i);
    await user.type(descInput, 'Classic Italian pizza with tomato sauce and basil.');

    // Add another ingredient row
    const addIngBtn = screen.getByRole('button', { name: /Add Ingredient/i });
    await user.click(addIngBtn);

    const ingInputs = screen.getAllByPlaceholderText(/Ingredient name/i);
    expect(ingInputs.length).toBe(2);

    // Fill first ingredient
    await user.type(ingInputs[0], 'Pizza Dough');

    // Fill first instruction
    const stepInputs = screen.getAllByPlaceholderText(/Step 1 description/i);
    await user.type(stepInputs[0], 'Preheat oven to 450 degrees.');

    // Submit form
    await user.click(submitBtn);

    await waitFor(() => {
      expect(recipeService.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Homemade Margherita Pizza',
          description: 'Classic Italian pizza with tomato sauce and basil.',
        })
      );
    });
  });
});
