import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import MealPlannerPage from './pages/MealPlannerPage';
import GroceryListPage from './pages/GroceryListPage';
import InsightsPage from './pages/InsightsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <FavoritesProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="recipes" element={<RecipesPage />} />
              <Route path="recipes/:id" element={<RecipeDetailPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="planner" element={<MealPlannerPage />} />
              <Route path="grocery-list" element={<GroceryListPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </FavoritesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
