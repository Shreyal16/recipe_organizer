import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './testUtils';
import FavoritesPage from '../pages/FavoritesPage';
import * as favoriteService from '../services/favoriteService';
import { mockRecipes } from './fixtures/mockData';

vi.mock('../services/favoriteService');

describe('FavoritesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner while favorites are fetching', () => {
    favoriteService.getFavorites.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<FavoritesPage />);
    expect(screen.getByText(/Loading your favorites/i)).toBeInTheDocument();
  });

  it('renders favorite recipe cards when favorites exist', async () => {
    favoriteService.getFavorites.mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'fav-1',
          recipeId: mockRecipes[0],
        },
      ],
    });

    renderWithProviders(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Tuscan Pasta')).toBeInTheDocument();
    });

    expect(screen.getByText('Italian')).toBeInTheDocument();
  });

  it('renders empty state when there are no saved favorites', async () => {
    favoriteService.getFavorites.mockResolvedValue({
      success: true,
      data: [],
    });

    renderWithProviders(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('No favorites saved yet')).toBeInTheDocument();
    });

    expect(screen.getByText(/Browse the recipe explorer/i)).toBeInTheDocument();
  });

  it('gracefully handles stale/deleted recipe references with an alert card and remove action', async () => {
    const user = userEvent.setup();
    favoriteService.getFavorites.mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'fav-stale-1',
          recipeId: null, // deleted recipe
          rawRecipeId: 'rec-deleted-123',
        },
      ],
    });
    favoriteService.removeFavorite.mockResolvedValue({
      success: true,
      data: {},
    });

    renderWithProviders(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Recipe Unavailable')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/This recipe was deleted from the collection/i)
    ).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /Remove/i });
    await user.click(removeBtn);

    await waitFor(() => {
      expect(favoriteService.removeFavorite).toHaveBeenCalledWith('rec-deleted-123');
    });
  });
});
