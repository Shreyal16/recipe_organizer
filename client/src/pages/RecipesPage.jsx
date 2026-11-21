import React, { useState, useEffect, useCallback } from 'react';
import recipeService from '../services/recipeService';
import RecipeCard from '../components/recipes/RecipeCard';
import RecipeFilters from '../components/recipes/RecipeFilters';
import RecipeFormModal from '../components/recipes/RecipeFormModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import { Plus, ChevronLeft, ChevronRight, ChefHat } from 'lucide-react';

const initialFilters = {
  q: '',
  ingredients: '',
  ingredientMatch: 'any',
  cuisine: '',
  mealType: '',
  maxPrepTime: '',
  dietaryTags: '',
  sort: 'newest',
  page: 1,
  limit: 12,
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Delete dialog state
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Success toast/message state
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await recipeService.getRecipes(filters);
      setRecipes(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to load recipes:', err);
      setError(err.message || 'Failed to load recipes.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > meta.totalPages) return;
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreate = () => {
    setRecipeToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (recipe) => {
    setRecipeToEdit(recipe);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setSubmittingForm(true);
      if (recipeToEdit) {
        await recipeService.updateRecipe(recipeToEdit._id, formData);
        setSuccessMessage(`Recipe "${formData.title}" updated successfully!`);
      } else {
        await recipeService.createRecipe(formData);
        setSuccessMessage(`Recipe "${formData.title}" created successfully!`);
      }
      setIsFormOpen(false);
      fetchRecipes();
    } catch (err) {
      console.error('Failed to save recipe:', err);
      alert(err.message || 'Failed to save recipe.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!recipeToDelete) return;
    try {
      setDeleting(true);
      await recipeService.deleteRecipe(recipeToDelete._id);
      setSuccessMessage(`Recipe "${recipeToDelete.title}" deleted.`);
      setRecipeToDelete(null);
      fetchRecipes();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      alert(err.message || 'Failed to delete recipe.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Recipe Explorer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Discover, search, and manage your culinary recipe collection.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleOpenCreate}
          className="self-start sm:self-auto shadow-sm"
        >
          Add Recipe
        </Button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && <ErrorBanner message={error} onRetry={fetchRecipes} />}

      {/* Filters & Search Component */}
      <RecipeFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Main Content Grid */}
      {loading ? (
        <LoadingSpinner text="Loading delicious recipes..." fullScreen />
      ) : recipes.length === 0 ? (
        <EmptyState
          title="No recipes match your criteria"
          description="Try clearing some filters, adjusting your search query, or add a brand new recipe."
          icon={ChefHat}
          actionLabel="Add New Recipe"
          onAction={handleOpenCreate}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                onEdit={handleOpenEdit}
                onDelete={(r) => setRecipeToDelete(r)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-5 mt-8">
              <span className="text-xs text-gray-500 font-medium">
                Showing Page <span className="font-bold text-gray-900">{meta.page}</span> of{' '}
                <span className="font-bold text-gray-900">{meta.totalPages}</span> ({meta.total} total recipes)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeft}
                  disabled={meta.page <= 1}
                  onClick={() => handlePageChange(meta.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronRight}
                  iconPosition="right"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => handlePageChange(meta.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Recipe Modal */}
      <RecipeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        recipeToEdit={recipeToEdit}
        loading={submittingForm}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(recipeToDelete)}
        onClose={() => setRecipeToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Recipe"
        message={`Are you sure you want to permanently delete "${recipeToDelete?.title}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        loading={deleting}
      />
    </div>
  );
}
