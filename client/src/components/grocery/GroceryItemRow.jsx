import React from 'react';
import { Trash2, Edit2, Check } from 'lucide-react';

export default function GroceryItemRow({
  item,
  onTogglePurchased,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className={`
        flex items-center justify-between p-3 rounded-xl border transition-all duration-150
        ${
          item.isPurchased
            ? 'bg-gray-50/80 border-gray-200 text-gray-400'
            : 'bg-white border-gray-200/80 text-gray-800 shadow-2xs hover:border-brand-300'
        }
      `}
    >
      {/* Left: Checkbox & Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onTogglePurchased(item._id, !item.isPurchased)}
          aria-label={item.isPurchased ? 'Mark as unpurchased' : 'Mark as purchased'}
          className={`
            w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0
            ${
              item.isPurchased
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'border-gray-300 hover:border-brand-500 bg-white'
            }
          `}
        >
          {item.isPurchased && <Check className="w-3.5 h-3.5 stroke-3" />}
        </button>

        <div className="min-w-0">
          <span
            className={`text-sm font-semibold block truncate ${
              item.isPurchased ? 'line-through text-gray-400' : 'text-gray-900'
            }`}
          >
            {item.ingredientName}
          </span>
          <span className="text-xs text-gray-500">
            {item.quantity !== null && item.quantity !== undefined
              ? `${item.quantity} ${item.unit}`.trim()
              : item.unit || 'As needed'}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Edit item"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item._id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
