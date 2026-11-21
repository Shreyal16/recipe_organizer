import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  UtensilsCrossed,
  Heart,
  CalendarDays,
  ShoppingCart,
  ChefHat,
  Sparkles,
} from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';

const navigation = [
  { name: 'Home', href: '/', icon: Home, end: true },
  { name: 'Recipes', href: '/recipes', icon: UtensilsCrossed },
  { name: 'Favorites', href: '/favorites', icon: Heart, badgeKey: 'favorites' },
  { name: 'Meal Planner', href: '/planner', icon: CalendarDays },
  { name: 'Grocery List', href: '/grocery-list', icon: ShoppingCart },
  { name: 'AI Insights', href: '/insights', icon: Sparkles },
];

export default function Sidebar() {
  const { favorites } = useFavorites();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-surface-card border-r border-surface-border z-30 transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-surface-border">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-xs">
          <ChefHat className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-surface-text tracking-tight leading-tight">
            Recipe Organizer
          </h1>
          <p className="text-xs text-surface-muted font-medium">Smart Meal Planner</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const badgeCount = item.badgeKey === 'favorites' ? favorites.length : 0;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.end}
              className={({ isActive }) => `
                flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150
                ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:text-brand-300 shadow-xs font-semibold'
                    : 'text-surface-muted hover:bg-surface-subtle hover:text-surface-text'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </div>
              {badgeCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-surface-border text-xs text-surface-muted text-center">
        MERN Capstone Platform
      </div>
    </aside>
  );
}
