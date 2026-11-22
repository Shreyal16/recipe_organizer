import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import recipeService from '../services/recipeService';
import { useFavorites } from '../context/FavoritesContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBanner from '../components/common/ErrorBanner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RecipeFormModal from '../components/recipes/RecipeFormModal';
import AddToMealPlanModal from '../components/recipes/AddToMealPlanModal';
import {
  Clock,
  Users,
  Flame,
  Heart,
  CalendarDays,
  Edit2,
  Trash2,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { DEFAULT_RECIPE_IMAGE } from '../utils/constants';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Checked ingredients (checklist feature for cooking)
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  const favorited = isFavorite(id);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await recipeService.getRecipe(id);
      setRecipe(res.data);
    } catch (err) {
      console.error('Failed to load recipe detail:', err);
      setError(err.message || 'Recipe not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const handleFavoriteClick = async () => {
    try {
      setTogglingFav(true);
      await toggleFavorite(id);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setTogglingFav(false);
    }
  };

  const handleIngredientToggle = (idx) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleEditSubmit = async (formData) => {
    try {
      await recipeService.updateRecipe(id, formData);
      setIsEditOpen(false);
      fetchRecipe();
    } catch (err) {
      alert(err.message || 'Failed to update recipe');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await recipeService.deleteRecipe(id);
      navigate('/recipes');
    } catch (err) {
      alert(err.message || 'Failed to delete recipe');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading recipe details..." fullScreen />;
  }

  if (error || !recipe) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorBanner message={error || 'Recipe not found.'} />
        <div className="mt-4 text-center">
          <Link to="/recipes">
            <Button variant="secondary" icon={ArrowLeft}>
              Back to Recipes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back Button & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/recipes">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Recipes
          </Button>
        </Link>

        <div className="flex items-center flex-wrap gap-2">
          {/* Favorite Button */}
          <Button
            variant={favorited ? 'danger' : 'secondary'}
            size="sm"
            icon={Heart}
            loading={togglingFav}
            onClick={handleFavoriteClick}
          >
            {favorited ? 'Favorited' : 'Add to Favorites'}
          </Button>

          {/* Add to Meal Plan */}
          <Button
            variant="secondary"
            size="sm"
            icon={CalendarDays}
            onClick={() => setIsScheduleOpen(true)}
          >
            Schedule Meal
          </Button>

          {/* Edit */}
          <Button
            variant="secondary"
            size="sm"
            icon={Edit2}
            onClick={() => setIsEditOpen(true)}
          >
            Edit
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="text-red-600 hover:bg-red-50"
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="relative aspect-video sm:aspect-[21/9] w-full bg-gray-100 overflow-hidden">
          <img
            src={recipe.imageUrl || DEFAULT_RECIPE_IMAGE}
            alt={recipe.title}
            onError={(e) => {
              e.target.src = DEFAULT_RECIPE_IMAGE;
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="green" className="bg-brand-600 text-white border-transparent text-xs font-bold">
                {recipe.cuisine}
              </Badge>
              <Badge variant="amber" className="bg-amber-500 text-white border-transparent text-xs font-bold">
                {recipe.mealType}
              </Badge>
              {recipe.difficulty && (
                <Badge variant="gray" className="bg-white/20 backdrop-blur-md text-white border-white/30 text-xs font-medium">
                  {recipe.difficulty}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {recipe.title}
            </h1>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 border-b border-gray-100 bg-gray-50/50">
          <div className="p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Prep Time
            </span>
            <div className="flex items-center justify-center gap-1.5 font-bold text-gray-800 text-sm sm:text-base">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>{recipe.prepTimeMinutes} mins</span>
            </div>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Cook Time
            </span>
            <div className="flex items-center justify-center gap-1.5 font-bold text-gray-800 text-sm sm:text-base">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{recipe.cookTimeMinutes || 0} mins</span>
            </div>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Servings
            </span>
            <div className="flex items-center justify-center gap-1.5 font-bold text-gray-800 text-sm sm:text-base">
              <Users className="w-4 h-4 text-brand-600" />
              <span>{recipe.servings} people</span>
            </div>
          </div>

          <div className="p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Total Time
            </span>
            <div className="flex items-center justify-center gap-1.5 font-bold text-gray-800 text-sm sm:text-base">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} mins</span>
            </div>
          </div>
        </div>

        {/* Description & Dietary Tags */}
        <div className="p-6 sm:p-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Overview
          </h3>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-6">
            {recipe.description}
          </p>

          {/* Dietary & Seasonal Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {(recipe.dietaryTags || []).map((tag) => (
              <Badge key={tag} variant="purple" className="font-semibold">
                {tag}
              </Badge>
            ))}
            {(recipe.seasonalTags || []).map((tag) => (
              <Badge key={tag} variant="blue" className="font-semibold">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Ingredients & Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ingredients Checklist (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs h-fit">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">
              Ingredients
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {recipe.ingredients?.length || 0} items
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Click an ingredient to cross it off as you cook.
          </p>

          <ul className="space-y-2.5">
            {(recipe.ingredients || []).map((ing, idx) => {
              const checked = checkedIngredients[idx];
              return (
                <li
                  key={idx}
                  onClick={() => handleIngredientToggle(idx)}
                  className={`
                    flex items-center gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer select-none text-sm
                    ${
                      checked
                        ? 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                        : 'bg-white border-gray-200/70 hover:border-brand-300 text-gray-800'
                    }
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0
                      ${checked ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300 bg-white'}
                    `}
                  >
                    {checked && <Check className="w-3.5 h-3.5 stroke-3" />}
                  </div>

                  <span className="flex-1 font-medium">{ing.name}</span>

                  <span className="text-xs font-semibold text-gray-500">
                    {ing.quantity !== null && ing.quantity !== undefined
                      ? `${ing.quantity} ${ing.unit}`.trim()
                      : ing.unit || ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Instructions (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs h-fit">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">
              Cooking Instructions
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {recipe.instructions?.length || 0} steps
            </span>
          </div>

          <div className="space-y-4">
            {(recipe.instructions || []).map((ins, idx) => {
              const stepNumber = ins.step || idx + 1;
              const text = typeof ins === 'string' ? ins : ins.text;

              return (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-gray-50/60 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {stepNumber}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-gray-700 leading-relaxed font-normal">
                      {text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Recipe Modal */}
      <RecipeFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        recipeToEdit={recipe}
      />

      {/* Add to Meal Plan Modal */}
      <AddToMealPlanModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        recipe={recipe}
        onSuccess={() => alert(`Added "${recipe.title}" to your meal plan!`)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Recipe"
        message={`Are you sure you want to permanently delete "${recipe.title}"?`}
        confirmText="Yes, Delete"
        loading={deleting}
      />
    </div>
  );
}
