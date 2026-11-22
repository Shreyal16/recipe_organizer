import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './testUtils';
import GroceryListPage from '../pages/GroceryListPage';
import * as groceryListService from '../services/groceryListService';
import { mockGroceryList } from './fixtures/mockData';

vi.mock('../services/groceryListService');
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

describe('GroceryListPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner while grocery list is fetching', () => {
    groceryListService.getGroceryList.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<GroceryListPage />);
    expect(screen.getByText(/Loading grocery list/i)).toBeInTheDocument();
  });

  it('renders grocery list items grouped by category', async () => {
    groceryListService.getGroceryList.mockResolvedValue({
      success: true,
      data: mockGroceryList,
    });

    renderWithProviders(<GroceryListPage />);

    await waitFor(() => {
      expect(screen.getByText('Baby Spinach')).toBeInTheDocument();
      expect(screen.getByText('Heavy Cream')).toBeInTheDocument();
      expect(screen.getByText('Penne Pasta')).toBeInTheDocument();
    });

    // Check categories
    expect(screen.getByText('Produce')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Pantry & Spices')).toBeInTheDocument();
  });

  it('optimistically updates checkbox when clicked and persists via API', async () => {
    const user = userEvent.setup();
    groceryListService.getGroceryList.mockResolvedValue({
      success: true,
      data: mockGroceryList,
    });
    groceryListService.patchGroceryItem.mockResolvedValue({
      success: true,
      data: mockGroceryList,
    });

    renderWithProviders(<GroceryListPage />);

    await waitFor(() => {
      expect(screen.getByText('Baby Spinach')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('button', { name: /Mark as purchased/i });
    await user.click(checkboxes[0]);

    // Should immediately call patchGroceryItem with isPurchased: true
    expect(groceryListService.patchGroceryItem).toHaveBeenCalledWith(
      'gl-001',
      'item-001',
      { isPurchased: true }
    );
  });

  it('reverts optimistic checkbox change when API update fails', async () => {
    const user = userEvent.setup();
    groceryListService.getGroceryList.mockResolvedValue({
      success: true,
      data: mockGroceryList,
    });
    // First call succeeds, then patch fails, then getGroceryList refetches initial state
    groceryListService.patchGroceryItem.mockRejectedValue(new Error('Network disconnected'));

    renderWithProviders(<GroceryListPage />);

    await waitFor(() => {
      expect(screen.getByText('Baby Spinach')).toBeInTheDocument();
    });

    groceryListService.getGroceryList.mockClear();

    const checkboxes = screen.getAllByRole('button', { name: /Mark as purchased/i });
    await user.click(checkboxes[0]);

    await waitFor(() => {
      // Upon failure, fetchGroceryList is called again to revert the optimistic change
      expect(groceryListService.getGroceryList).toHaveBeenCalledTimes(1);
    });
  });

  it('renders empty state when no grocery list exists and allows generating from plan', async () => {
    const user = userEvent.setup();
    // 404 response indicating list does not exist
    groceryListService.getGroceryList.mockRejectedValue({
      status: 404,
      message: 'Not found',
    });
    groceryListService.generateGroceryList.mockResolvedValue({
      success: true,
      data: mockGroceryList,
    });

    renderWithProviders(<GroceryListPage />);

    await waitFor(() => {
      expect(screen.getByText(/No grocery list generated for this week/i)).toBeInTheDocument();
    });

    const generateBtn = screen.getByRole('button', { name: /Generate from Meals/i });
    await user.click(generateBtn);

    await waitFor(() => {
      expect(groceryListService.generateGroceryList).toHaveBeenCalled();
    });
  });
});

