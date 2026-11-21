import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, Heart, CalendarDays, ShoppingCart, Sparkles } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';

const navigation = [
  { name: 'Home', href: '/', icon: Home, end: true },
  { name: 'Recipes', href: '/recipes', icon: UtensilsCrossed },
  { name: 'Favorites', href: '/favorites', icon: Heart, badgeKey: 'favorites' },
  { name: 'Planner', href: '/planner', icon: CalendarDays },
  { name: 'Grocery', href: '/grocery-list', icon: ShoppingCart },
  { name: 'Insights', href: '/insights', icon: Sparkles },
];

export default function MobileNav() {
  const { favorites } = useFavorites();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface-card border-t border-surface-border z-40 px-2 py-1 shadow-lg transition-colors">
      <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const Icon = item.icon;
          const badgeCount = item.badgeKey === 'favorites' ? favorites.length : 0;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.end}
              className={({ isActive }) => `
                flex flex-col items-center justify-center py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors relative
                ${isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-surface-muted hover:text-surface-text'}
              `}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-brand-500 text-white">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[11px]">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
