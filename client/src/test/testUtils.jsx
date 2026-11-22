import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { FavoritesProvider } from '../context/FavoritesContext';

export function renderWithProviders(ui, { initialEntries = ['/'], ...options } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <FavoritesProvider>
          {ui}
        </FavoritesProvider>
      </ThemeProvider>
    </MemoryRouter>,
    options
  );
}

export function renderWithRouter(ui, { initialEntries = ['/'], ...options } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>,
    options
  );
}
