import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 border border-brand-200 dark:border-brand-800/60 shadow-xs">
        <Compass className="w-8 h-8 animate-pulse" />
      </div>

      <h1 className="text-4xl font-black text-surface-text tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-surface-text mb-2">Page Not Found</h2>
      <p className="text-sm text-surface-muted max-w-md mb-6">
        The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button variant="primary" size="md">
            <Home className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>
        <Link to="/recipes">
          <Button variant="secondary" size="md">
            <ArrowLeft className="w-4 h-4 mr-2" /> Explore Recipes
          </Button>
        </Link>
      </div>
    </div>
  );
}
