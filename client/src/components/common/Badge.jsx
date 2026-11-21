import React from 'react';

const variantClasses = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function Badge({ children, variant = 'gray', className = '', ...props }) {
  const chosenStyle = variantClasses[variant] || variantClasses.gray;

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        tracking-wide transition-colors ${chosenStyle} ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
