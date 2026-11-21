import React, { useState, useEffect, useCallback } from 'react';
import insightsService from '../services/insightsService';
import CuisineDistributionChart from '../components/insights/CuisineDistributionChart';
import PopularMealTypesChart from '../components/insights/PopularMealTypesChart';
import CommonIngredientsChart from '../components/insights/CommonIngredientsChart';
import SavedRecipesList from '../components/insights/SavedRecipesList';
import PantryPreferencesCard from '../components/insights/PantryPreferencesCard';
import RecommendationsList from '../components/insights/RecommendationsList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBanner from '../components/common/ErrorBanner';
import { Sparkles, RefreshCw, Brain } from 'lucide-react';

export default function InsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await insightsService.getInsights();
      setInsights(res.data);
    } catch (err) {
      console.error('Failed to load insights:', err);
      setError(err.message || 'Failed to fetch AI insights. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm font-medium text-surface-muted">
          Computing personalized culinary insights & recommendations...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>Smart Rule-Based AI Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-text tracking-tight">
            Recipe Insights & Smart Personalization
          </h1>
          <p className="text-sm text-surface-muted mt-1 max-w-2xl">
            Analyze your culinary habits, track collection staples, manage pantry ingredients, and explore rule-based recipe suggestions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-surface-border bg-surface-card hover:bg-surface-subtle text-surface-text transition-colors self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Recalculating...' : 'Refresh Insights'}
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => fetchInsights()} />}

      {/* 1. Preferences & Pantry Input Card */}
      <section>
        <PantryPreferencesCard onPreferencesSaved={() => fetchInsights(true)} />
      </section>

      {/* 2. Top-Level Visualizations Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category 1: Preferred Cuisines */}
        <CuisineDistributionChart data={insights?.preferredCuisines || []} />

        {/* Category 4: Popular Meal Types (Accurately labeled) */}
        <PopularMealTypesChart data={insights?.popularMealTypes || []} />
      </section>

      {/* 3. Middle Section: Common Ingredients & Saved Recipes */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category 3: Common Ingredients */}
        <CommonIngredientsChart data={insights?.commonIngredients || []} />

        {/* Category 2: Frequently Saved Recipes (Accurately labeled) */}
        <SavedRecipesList recipes={insights?.frequentlySavedRecipes || []} />
      </section>

      {/* 4. Category 5: Ingredient-Based Recipe Ideas & Recommendations */}
      <section>
        <RecommendationsList
          recommendations={insights?.recommendations || []}
          onMealAdded={() => fetchInsights(true)}
        />
      </section>
    </div>
  );
}
