import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { CUISINES, MEAL_TYPES, DIETARY_TAGS, SORT_OPTIONS } from '../../utils/constants';
import Button from '../common/Button';

export default function RecipeFilters({
  filters,
  onChange,
  onClear,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTextChange = (field, value) => {
    onChange({ ...filters, [field]: value, page: 1 });
  };

  const handleDietaryTagToggle = (tag) => {
    const currentTags = filters.dietaryTags
      ? filters.dietaryTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    let updated;
    if (currentTags.includes(tag)) {
      updated = currentTags.filter((t) => t !== tag);
    } else {
      updated = [...currentTags, tag];
    }
    onChange({
      ...filters,
      dietaryTags: updated.join(','),
      page: 1,
    });
  };

  const activeFilterCount = [
    filters.q,
    filters.ingredients,
    filters.cuisine,
    filters.mealType,
    filters.maxPrepTime,
    filters.dietaryTags,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs mb-6">
      {/* Top Search & Quick Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Title Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={filters.q || ''}
            onChange={(e) => handleTextChange('q', e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-gray-300 placeholder:text-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50/50 hover:bg-white transition-colors"
          />
        </div>

        {/* Cuisine Select */}
        <div>
          <select
            value={filters.cuisine || ''}
            onChange={(e) => handleTextChange('cuisine', e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All Cuisines</option>
            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Meal Type Select */}
        <div>
          <select
            value={filters.mealType || ''}
            onChange={(e) => handleTextChange('mealType', e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All Meal Types</option>
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Select */}
        <div>
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => handleTextChange('sort', e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium text-gray-700"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filter Toggle & Clear Actions */}
      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-100 text-xs">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Hide Advanced Filters' : 'More Filters (Ingredients, Prep Time, Diet)'}</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-800 text-[11px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors font-medium"
          >
            <X className="w-3.5 h-3.5" />
            Clear all filters
          </button>
        )}
      </div>

      {/* Advanced Filter Panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Ingredient-based Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Filter by Ingredients
            </label>
            <input
              type="text"
              placeholder="e.g. tomato, paneer, garlic"
              value={filters.ingredients || ''}
              onChange={(e) => handleTextChange('ingredients', e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 placeholder:text-gray-500 text-gray-900 focus:ring-brand-500 focus:border-brand-500 bg-white"
            />
            {/* Match Strategy Toggle */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
              <span className="font-medium">Match:</span>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="ingredientMatch"
                  checked={filters.ingredientMatch !== 'all'}
                  onChange={() => handleTextChange('ingredientMatch', 'any')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                Any ingredient
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="ingredientMatch"
                  checked={filters.ingredientMatch === 'all'}
                  onChange={() => handleTextChange('ingredientMatch', 'all')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                All ingredients
              </label>
            </div>
          </div>

          {/* Maximum Prep Time */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Max Prep Time (Minutes)
            </label>
            <select
              value={filters.maxPrepTime || ''}
              onChange={(e) => handleTextChange('maxPrepTime', e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:ring-brand-500 focus:border-brand-500 bg-white"
            >
              <option value="">Any preparation time</option>
              <option value="15">Under 15 minutes</option>
              <option value="30">Under 30 minutes</option>
              <option value="45">Under 45 minutes</option>
              <option value="60">Under 1 hour</option>
            </select>
          </div>

          {/* Dietary Tags */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIETARY_TAGS.map((tag) => {
                const selected = (filters.dietaryTags || '')
                  .split(',')
                  .map((t) => t.trim())
                  .includes(tag);

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleDietaryTagToggle(tag)}
                    className={`
                      px-2.5 py-1 rounded-full text-xs font-medium transition-colors border
                      ${
                        selected
                          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
