import React, { useState, useEffect } from 'react';
import preferenceService from '../../services/preferenceService';
import Button from '../common/Button';
import { Package, Plus, X, Check, Utensils, AlertCircle } from 'lucide-react';

const COMMON_CUISINES = [
  'Indian',
  'Italian',
  'Mexican',
  'Asian',
  'American',
  'Mediterranean',
  'Chinese',
  'Japanese',
];

export default function PantryPreferencesCard({ onPreferencesSaved }) {
  const [preferences, setPreferences] = useState(null);
  const [pantryInput, setPantryInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPrefs = async () => {
      try {
        setLoading(true);
        const res = await preferenceService.getPreferences();
        if (isMounted) {
          setPreferences(res.data);
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPrefs();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddIngredient = (e) => {
    if (e) e.preventDefault();
    const raw = pantryInput.trim();
    if (!raw) return;

    setInputError('');

    // Normalize for case-insensitive duplicate checking
    const existing = preferences?.pantryIngredients || [];
    const isDuplicate = existing.some(
      (item) => item.trim().toLowerCase() === raw.toLowerCase()
    );

    if (isDuplicate) {
      setInputError(`"${raw}" is already in your pantry.`);
      return;
    }

    // Preserve readable display name (trimmed)
    const updated = [...existing, raw];
    setPreferences((prev) => ({
      ...prev,
      pantryIngredients: updated,
    }));
    setPantryInput('');
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setPreferences((prev) => ({
      ...prev,
      pantryIngredients: prev.pantryIngredients.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleToggleCuisine = (cuisine) => {
    const existing = preferences?.preferredCuisines || [];
    const exists = existing.includes(cuisine);
    const updated = exists
      ? existing.filter((c) => c !== cuisine)
      : [...existing, cuisine];

    setPreferences((prev) => ({
      ...prev,
      preferredCuisines: updated,
    }));
  };

  const handleSave = async () => {
    if (!preferences) return;
    try {
      setSaving(true);
      setInputError('');

      // Submit complete PUT resource preserving dietaryPreferences and all fields
      const payload = {
        preferredCuisines: preferences.preferredCuisines || [],
        dietaryPreferences: preferences.dietaryPreferences || [],
        pantryIngredients: preferences.pantryIngredients || [],
      };

      const res = await preferenceService.updatePreferences(payload);
      setPreferences(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh insights in parent
      if (typeof onPreferencesSaved === 'function') {
        onPreferencesSaved();
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setInputError(err.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-surface-subtle rounded mb-4"></div>
        <div className="h-10 bg-surface-subtle rounded mb-4"></div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-surface-subtle rounded-full"></div>
          <div className="h-8 w-24 bg-surface-subtle rounded-full"></div>
        </div>
      </div>
    );
  }

  const pantryList = preferences?.pantryIngredients || [];
  const activeCuisines = preferences?.preferredCuisines || [];

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-surface-text flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Pantry Ingredients & Cuisine Preferences
          </h3>
          <p className="text-xs text-surface-muted mt-0.5">
            Tell the smart recommendation engine what ingredients you have in your kitchen
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> Saved & Insights Refreshed!
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saving}
            disabled={saving}
          >
            Save Preferences
          </Button>
        </div>
      </div>

      {inputError && (
        <div className="mb-4 flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{inputError}</span>
        </div>
      )}

      {/* Pantry Free-Text Input & Chips */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-surface-text uppercase tracking-wider mb-2">
          Available Pantry Ingredients ({pantryList.length})
        </label>

        <form onSubmit={handleAddIngredient} className="flex gap-2 mb-3">
          <input
            type="text"
            value={pantryInput}
            onChange={(e) => {
              setPantryInput(e.target.value);
              if (inputError) setInputError('');
            }}
            placeholder="e.g. olive oil, garlic, eggs, cheddar..."
            className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-surface-border bg-surface-canvas text-surface-text placeholder-surface-muted focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
          />
          <Button type="submit" variant="secondary" size="md">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </form>

        {pantryList.length === 0 ? (
          <p className="text-xs text-surface-muted italic">
            No pantry ingredients added yet. Type an ingredient above and press Enter or Add.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {pantryList.map((item, idx) => (
              <span
                key={`${item}-${idx}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 transition-colors shadow-2xs"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(idx)}
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors focus:outline-hidden"
                  aria-label={`Remove ${item}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Preferred Cuisines Selection */}
      <div className="pt-4 border-t border-surface-border">
        <label className="block text-xs font-bold text-surface-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-surface-muted" />
          Preferred Cuisines ({activeCuisines.length} selected)
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_CUISINES.map((cuisine) => {
            const isSelected = activeCuisines.includes(cuisine);
            return (
              <button
                key={cuisine}
                type="button"
                onClick={() => handleToggleCuisine(cuisine)}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 border
                  ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-surface-canvas text-surface-muted border-surface-border hover:border-brand-500/50 hover:text-surface-text'
                  }
                `}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
