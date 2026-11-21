import React from 'react';
import { ChefHat } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No items found',
  description = 'Try adjusting your filters or search terms, or create a new entry.',
  icon: Icon = ChefHat,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl
        border border-dashed border-gray-300 max-w-xl mx-auto my-8 shadow-xs ${className}
      `}
    >
      <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} icon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
