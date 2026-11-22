import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './testUtils';
import ThemeToggle from '../components/common/ThemeToggle';
import Sidebar from '../components/layout/Sidebar';
import MobileNav from '../components/layout/MobileNav';
import NotFoundPage from '../pages/NotFoundPage';

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

describe('Theme and Navigation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('Theme Management', () => {
    it('defaults to system theme and toggles to dark and light modes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ThemeToggle />);

      const darkButton = screen.getByTitle('Dark theme');
      const lightButton = screen.getByTitle('Light theme');
      const systemButton = screen.getByTitle('System theme');

      expect(darkButton).toBeInTheDocument();
      expect(lightButton).toBeInTheDocument();
      expect(systemButton).toBeInTheDocument();

      // Click Dark
      await user.click(darkButton);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme_preference')).toBe('dark');

      // Click Light
      await user.click(lightButton);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('theme_preference')).toBe('light');

      // Click System
      await user.click(systemButton);
      expect(localStorage.getItem('theme_preference')).toBe('system');
    });
  });

  describe('Desktop and Mobile Navigation', () => {
    it('renders desktop sidebar with all major navigation links and brand title', () => {
      renderWithProviders(<Sidebar />);

      expect(screen.getByText('Recipe Organizer')).toBeInTheDocument();
      expect(screen.getByText('Smart Meal Planner')).toBeInTheDocument();

      expect(screen.getByRole('link', { name: /Home/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /Recipes/i })).toHaveAttribute('href', '/recipes');
      expect(screen.getByRole('link', { name: /Favorites/i })).toHaveAttribute('href', '/favorites');
      expect(screen.getByRole('link', { name: /Meal Planner/i })).toHaveAttribute('href', '/planner');
      expect(screen.getByRole('link', { name: /Grocery List/i })).toHaveAttribute('href', '/grocery-list');
      expect(screen.getByRole('link', { name: /AI Insights/i })).toHaveAttribute('href', '/insights');
    });

    it('renders mobile navigation with navigation items', () => {
      renderWithProviders(<MobileNav />);

      expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Favorites/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Planner/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Grocery/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Insights/i })).toBeInTheDocument();
    });
  });

  describe('Not Found Page', () => {
    it('renders 404 message and navigation recovery buttons', () => {
      renderWithProviders(<NotFoundPage />, { initialEntries: ['/unknown-random-route'] });

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Explore Recipes/i })).toBeInTheDocument();
    });
  });
});
