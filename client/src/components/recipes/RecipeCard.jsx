import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Heart, Edit2, Trash2 } from 'lucide-react';
import { DEFAULT_RECIPE_IMAGE } from '../../utils/constants';
import { useFavorites } from '../../context/FavoritesContext';
import Badge from '../common/Badge';

export default function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  showActions = true,
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imgSrc, setImgSrc] = useState(recipe.imageUrl || DEFAULT_RECIPE_IMAGE);
  const [toggling, setToggling] = useState(false);

  const favorited = isFavorite(recipe._id);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setToggling(true);
      await toggleFavorite(recipe._id);
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    } finally {
      setToggling(false);
    }
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit(recipe);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete(recipe);
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-gray-100">
        <img
          src={imgSrc}
          alt={recipe.title}
          onError={() => setImgSrc(DEFAULT_RECIPE_IMAGE)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={toggling}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className={`
            absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-sm
            ${
              favorited
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-white/90 text-gray-600 hover:text-rose-500 hover:bg-white'
            }
          `}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {/* Cuisine Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="green" className="backdrop-blur-md bg-white/90 shadow-xs font-semibold">
            {recipe.cuisine}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
              {recipe.mealType}
            </span>
            {recipe.difficulty && (
              <span className="text-xs text-gray-500 font-medium">
                • {recipe.difficulty}
              </span>
            )}
          </div>

          <Link to={`/recipes/${recipe._id}`} className="block focus:outline-none">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-1 mb-1.5">
              {recipe.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
              {recipe.description}
            </p>
          </Link>
        </div>

        {/* Metadata & Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{recipe.prepTimeMinutes}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>{recipe.servings} serv</span>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  title="Edit recipe"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  title="Delete recipe"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
