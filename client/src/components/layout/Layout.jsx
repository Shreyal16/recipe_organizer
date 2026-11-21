import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

const pageTitles = {
  '/': 'Home Dashboard',
  '/recipes': 'Recipe Collection',
  '/favorites': 'Favorite Recipes',
  '/planner': 'Weekly Meal Planner',
  '/grocery-list': 'Smart Grocery List',
  '/insights': 'AI Recipe Insights & Preferences',
};

export default function Layout() {
  const location = useLocation();
  const currentPath = location.pathname;

  let title = 'Recipe Organizer';
  if (currentPath === '/') {
    title = 'Home Dashboard';
  } else if (currentPath.startsWith('/recipes')) {
    title = 'Recipe Collection';
  } else if (pageTitles[currentPath]) {
    title = pageTitles[currentPath];
  }

  return (
    <div className="min-h-screen bg-surface-canvas text-surface-text flex transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Header title={title} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Navigation Bar */}
        <MobileNav />
      </div>
    </div>
  );
}
