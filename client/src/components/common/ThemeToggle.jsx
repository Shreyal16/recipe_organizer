import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { themeMode, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-xl p-1 bg-surface-subtle border border-surface-border gap-0.5">
      <button
        type="button"
        title="Light theme"
        onClick={() => setTheme('light')}
        className={`
          p-1.5 rounded-lg text-xs font-medium transition-colors
          ${
            themeMode === 'light'
              ? 'bg-surface-card text-brand-600 shadow-2xs font-bold'
              : 'text-surface-muted hover:text-surface-text'
          }
        `}
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        type="button"
        title="Dark theme"
        onClick={() => setTheme('dark')}
        className={`
          p-1.5 rounded-lg text-xs font-medium transition-colors
          ${
            themeMode === 'dark'
              ? 'bg-surface-card text-brand-400 shadow-2xs font-bold'
              : 'text-surface-muted hover:text-surface-text'
          }
        `}
      >
        <Moon className="w-4 h-4" />
      </button>

      <button
        type="button"
        title="System theme"
        onClick={() => setTheme('system')}
        className={`
          p-1.5 rounded-lg text-xs font-medium transition-colors
          ${
            themeMode === 'system'
              ? 'bg-surface-card text-brand-500 shadow-2xs font-bold'
              : 'text-surface-muted hover:text-surface-text'
          }
        `}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
