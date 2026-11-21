import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { GROCERY_CATEGORIES } from '../../utils/constants';

export default function AddGroceryItemModal({
  isOpen,
  onClose,
  onAdd,
  loading = false,
}) {
  const [ingredientName, setIngredientName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('Pantry & General');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ingredientName.trim()) return;

    onAdd({
      ingredientName: ingredientName.trim(),
      quantity: quantity !== '' && !isNaN(quantity) ? Number(quantity) : null,
      unit: unit.trim(),
      category: category.trim() || 'Other',
      isPurchased: false,
    });

    setIngredientName('');
    setQuantity('');
    setUnit('');
    setCategory('Pantry & General');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Grocery Item" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Ingredient / Item Name"
          required
          placeholder="e.g. Olive Oil, Almonds, Sourdough"
          value={ingredientName}
          onChange={(e) => setIngredientName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            step="any"
            min={0}
            placeholder="e.g. 500, 2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <Input
            label="Unit"
            placeholder="e.g. g, ml, piece"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>

        <Select
          label="Category"
          options={GROCERY_CATEGORIES}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Add Item
          </Button>
        </div>
      </form>
    </Modal>
  );
}
