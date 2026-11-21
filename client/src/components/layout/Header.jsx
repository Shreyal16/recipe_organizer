import React from 'react';
import { ChefHat } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

export default function Header({ title = 'Recipe Organizer' }) {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-surface-card border-b border-surface-border sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Mobile Branding / Desktop Title */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="font-bold text-surface-text text-sm">Recipe Planner</span>
        </div>
        <h2 className="hidden md:block text-xl font-bold text-surface-text tracking-tight">
          {title}
        </h2>
      </div>

      {/* Date & Theme Selector */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-block text-xs font-medium text-surface-muted bg-surface-subtle px-3 py-1.5 rounded-full border border-surface-border">
          {todayFormatted}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
