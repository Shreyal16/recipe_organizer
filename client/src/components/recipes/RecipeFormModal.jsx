import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import ErrorBanner from '../common/ErrorBanner';
import { Plus, Trash2 } from 'lucide-react';
import { CUISINES, MEAL_TYPES, DIFFICULTIES, DIETARY_TAGS } from '../../utils/constants';

const initialFormData = {
  title: '',
  description: '',
  imageUrl: '',
  cuisine: 'Indian',
  mealType: 'Dinner',
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  servings: 4,
  difficulty: 'Medium',
  dietaryTags: [],
  seasonalTags: [],
  ingredients: [{ name: '', quantity: '', unit: '' }],
  instructions: [{ step: 1, text: '' }],
};

export default function RecipeFormModal({
  isOpen,
  onClose,
  onSubmit,
  recipeToEdit = null,
  loading = false,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (recipeToEdit) {
      setFormData({
        title: recipeToEdit.title || '',
        description: recipeToEdit.description || '',
        imageUrl: recipeToEdit.imageUrl || '',
        cuisine: recipeToEdit.cuisine || 'Indian',
        mealType: recipeToEdit.mealType || 'Dinner',
        prepTimeMinutes: recipeToEdit.prepTimeMinutes ?? 20,
        cookTimeMinutes: recipeToEdit.cookTimeMinutes ?? 0,
        servings: recipeToEdit.servings ?? 4,
        difficulty: recipeToEdit.difficulty || 'Medium',
        dietaryTags: recipeToEdit.dietaryTags || [],
        seasonalTags: recipeToEdit.seasonalTags || [],
        ingredients:
          recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0
            ? recipeToEdit.ingredients.map((ing) => ({
                name: ing.name || '',
                quantity: ing.quantity ?? '',
                unit: ing.unit || '',
              }))
            : [{ name: '', quantity: '', unit: '' }],
        instructions:
          recipeToEdit.instructions && recipeToEdit.instructions.length > 0
            ? recipeToEdit.instructions.map((ins, idx) => ({
                step: ins.step || idx + 1,
                text: typeof ins === 'string' ? ins : ins.text || '',
              }))
            : [{ step: 1, text: '' }],
      });
    } else {
      setFormData(initialFormData);
    }
    setValidationError(null);
  }, [recipeToEdit, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Ingredients handling
  const handleIngredientChange = (index, field, value) => {
    const updated = [...formData.ingredients];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, ingredients: updated }));
  };

  const addIngredientRow = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '' }],
    }));
  };

  const removeIngredientRow = (index) => {
    if (formData.ingredients.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  // Instructions handling
  const handleInstructionChange = (index, value) => {
    const updated = [...formData.instructions];
    updated[index].text = value;
    setFormData((prev) => ({ ...prev, instructions: updated }));
  };

  const addInstructionStep = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [
        ...prev.instructions,
        { step: prev.instructions.length + 1, text: '' },
      ],
    }));
  };

  const removeInstructionStep = (index) => {
    if (formData.instructions.length <= 1) return;
    const filtered = formData.instructions.filter((_, i) => i !== index);
    const renumbered = filtered.map((item, idx) => ({
      step: idx + 1,
      text: item.text,
    }));
    setFormData((prev) => ({ ...prev, instructions: renumbered }));
  };

  // Dietary tags toggling
  const toggleDietaryTag = (tag) => {
    const current = formData.dietaryTags;
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setFormData((prev) => ({ ...prev, dietaryTags: updated }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    // Basic client validation
    if (!formData.title.trim()) {
      setValidationError('Recipe title is required');
      return;
    }
    if (!formData.description.trim()) {
      setValidationError('Recipe description is required');
      return;
    }

    const validIngredients = formData.ingredients.filter((ing) => ing.name.trim() !== '');
    if (validIngredients.length === 0) {
      setValidationError('At least one ingredient with a name is required');
      return;
    }

    const validInstructions = formData.instructions
      .filter((ins) => ins.text.trim() !== '')
      .map((ins, idx) => ({ step: idx + 1, text: ins.text.trim() }));
    if (validInstructions.length === 0) {
      setValidationError('At least one instruction step is required');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim() || undefined,
      cuisine: formData.cuisine,
      mealType: formData.mealType,
      prepTimeMinutes: Number(formData.prepTimeMinutes) || 0,
      cookTimeMinutes: Number(formData.cookTimeMinutes) || 0,
      servings: Number(formData.servings) || 1,
      difficulty: formData.difficulty,
      dietaryTags: formData.dietaryTags,
      seasonalTags: formData.seasonalTags,
      ingredients: validIngredients.map((ing) => ({
        name: ing.name.trim(),
        quantity: ing.quantity !== '' && !isNaN(ing.quantity) ? Number(ing.quantity) : null,
        unit: (ing.unit || '').trim(),
      })),
      instructions: validInstructions,
    };

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recipeToEdit ? 'Edit Recipe' : 'Create New Recipe'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {validationError && (
          <ErrorBanner message={validationError} />
        )}

        {/* Basic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Recipe Title"
              required
              placeholder="e.g. Creamy Paneer Butter Masala"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="A brief flavorful overview of this dish..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Image URL"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              helperText="Leave blank for an automatic high-quality food fallback image."
            />
          </div>

          <Select
            label="Cuisine"
            required
            options={CUISINES}
            value={formData.cuisine}
            onChange={(e) => handleChange('cuisine', e.target.value)}
          />

          <Select
            label="Meal Type"
            required
            options={MEAL_TYPES}
            value={formData.mealType}
            onChange={(e) => handleChange('mealType', e.target.value)}
          />

          <Input
            label="Prep Time (Minutes)"
            type="number"
            min={0}
            required
            value={formData.prepTimeMinutes}
            onChange={(e) => handleChange('prepTimeMinutes', e.target.value)}
          />

          <Input
            label="Cook Time (Minutes)"
            type="number"
            min={0}
            value={formData.cookTimeMinutes}
            onChange={(e) => handleChange('cookTimeMinutes', e.target.value)}
          />

          <Input
            label="Servings"
            type="number"
            min={1}
            required
            value={formData.servings}
            onChange={(e) => handleChange('servings', e.target.value)}
          />

          <Select
            label="Difficulty"
            options={DIFFICULTIES}
            value={formData.difficulty}
            onChange={(e) => handleChange('difficulty', e.target.value)}
          />
        </div>

        {/* Dietary Tags */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Dietary Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => {
              const selected = formData.dietaryTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleDietaryTag(tag)}
                  className={`
                    px-3 py-1 text-xs rounded-full border font-medium transition-colors
                    ${
                      selected
                        ? 'bg-brand-600 text-white border-brand-600'
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

        {/* Dynamic Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Ingredients <span className="text-red-500">*</span>
            </label>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={addIngredientRow}
            >
              Add Ingredient
            </Button>
          </div>
          <div className="space-y-2">
            {formData.ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ingredient name (e.g. Paneer)"
                  required
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                  className="flex-3 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:ring-brand-500 focus:border-brand-500"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:ring-brand-500 focus:border-brand-500"
                />
                <input
                  type="text"
                  placeholder="Unit (g, ml, cup)"
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                  className="flex-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:ring-brand-500 focus:border-brand-500"
                />
                <button
                  type="button"
                  disabled={formData.ingredients.length <= 1}
                  onClick={() => removeIngredientRow(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Instructions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Cooking Instructions <span className="text-red-500">*</span>
            </label>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={addInstructionStep}
            >
              Add Step
            </Button>
          </div>
          <div className="space-y-2">
            {formData.instructions.map((ins, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-6 h-7 flex items-center justify-center rounded-md bg-gray-100 text-xs font-bold text-gray-700 shrink-0 mt-0.5">
                  {ins.step}
                </span>
                <textarea
                  rows={2}
                  required
                  placeholder={`Step ${ins.step} description...`}
                  value={ins.text}
                  onChange={(e) => handleInstructionChange(idx, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:ring-brand-500 focus:border-brand-500"
                />
                <button
                  type="button"
                  disabled={formData.instructions.length <= 1}
                  onClick={() => removeInstructionStep(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {recipeToEdit ? 'Save Changes' : 'Create Recipe'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
