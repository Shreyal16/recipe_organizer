import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  text = 'Loading...',
  fullScreen = false,
  className = '',
}) {
  const content = (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 text-gray-500 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      {text && <p className="text-sm font-medium text-gray-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
