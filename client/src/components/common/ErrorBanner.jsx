import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorBanner({
  message = 'An unexpected error occurred.',
  details,
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`
        bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 flex flex-col sm:flex-row
        items-start sm:items-center justify-between gap-3 my-4 ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-red-800">{message}</h4>
          {details && Array.isArray(details) && details.length > 0 && (
            <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
              {details.map((d, i) => (
                <li key={i}>{typeof d === 'string' ? d : `${d.field}: ${d.message}`}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw} className="shrink-0">
          Try Again
        </Button>
      )}
    </div>
  );
}
