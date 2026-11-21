import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { GROCERY_CATEGORIES } from '../../utils/constants';

export default function EditGroceryItemModal({
  isOpen,
  onClose,
  item,
  onSave,
  loading = false,
}) {
  const [ingredientName, setIngredientName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('Pantry & General');

  useEffect(() => {
    if (item) {
      setIngredientName(item.ingredientName || '');
      setQuantity(item.quantity !== null && item.quantity !== undefined ? item.quantity : '');
      setUnit(item.unit || '');
      setCategory(item.category || 'Pantry & General');
    }
  }, [item, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ingredientName.trim() || !item) return;

    onSave(item._id, {
      ingredientName: ingredientName.trim(),
      quantity: quantity !== '' && !isNaN(quantity) ? Number(quantity) : null,
      unit: unit.trim(),
      category: category.trim() || 'Other',
    });
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Grocery Item" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Ingredient / Item Name"
          required
          value={ingredientName}
          onChange={(e) => setIngredientName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            step="any"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <Input
            label="Unit"
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
