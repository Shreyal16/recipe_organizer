import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBanner from '../common/ErrorBanner';
import { Search, Plus } from 'lucide-react';
import recipeService from '../../services/recipeService';
import { DEFAULT_RECIPE_IMAGE } from '../../utils/constants';

export default function RecipeSelectorModal({
  isOpen,
  onClose,
  onSelectRecipe,
  title = 'Select a Recipe for Meal Plan',
}) {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await recipeService.getRecipes({
          q: searchTerm.trim() || undefined,
          limit: 30,
        });
        setRecipes(res.data || []);
      } catch (err) {
        console.error('Failed to load recipes for selector:', err);
        setError(err.message || 'Could not load recipes');
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchRecipes, 200);
    return () => clearTimeout(timeout);
  }, [isOpen, searchTerm]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-gray-300 placeholder:text-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Recipe List */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <LoadingSpinner text="Searching recipes..." />
          ) : recipes.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No recipes found. Try a different search term.
            </p>
          ) : (
            recipes.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={r.imageUrl || DEFAULT_RECIPE_IMAGE}
                    alt={r.title}
                    onError={(e) => {
                      e.target.src = DEFAULT_RECIPE_IMAGE;
                    }}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">
                      {r.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {r.cuisine} • {r.prepTimeMinutes}m • {r.servings} serv
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  icon={Plus}
                  onClick={() => onSelectRecipe(r)}
                >
                  Select
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
