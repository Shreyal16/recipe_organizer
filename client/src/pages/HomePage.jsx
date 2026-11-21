import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import recipeService from '../services/recipeService';
import mealPlanService from '../services/mealPlanService';
import { useFavorites } from '../context/FavoritesContext';
import { getMondayString, getWeekDays, formatWeekRange } from '../utils/dateUtils';
import RecipeCard from '../components/recipes/RecipeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBanner from '../components/common/ErrorBanner';
import Button from '../components/common/Button';
import {
  UtensilsCrossed,
  CalendarDays,
  ShoppingCart,
  Heart,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  const { favorites } = useFavorites();
  const [newestRecipes, setNewestRecipes] = useState([]);
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [thisWeekPlan, setThisWeekPlan] = useState(null);
  const [totalRecipeCount, setTotalRecipeCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentMonday = getMondayString();
  const weekDays = getWeekDays(currentMonday);
  const todayDateStr = weekDays.find((d) => d.isToday)?.dateString;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch parallel from existing backend APIs
        const [newestRes, popularRes, planRes] = await Promise.allSettled([
          recipeService.getRecipes({ sort: 'newest', limit: 6 }),
          recipeService.getRecipes({ sort: 'popularity', limit: 6 }),
          mealPlanService.getMealPlan(currentMonday),
        ]);

        if (newestRes.status === 'fulfilled') {
          setNewestRecipes(newestRes.value.data || []);
          if (newestRes.value.meta) {
            setTotalRecipeCount(newestRes.value.meta.total || 0);
          }
        }
        if (popularRes.status === 'fulfilled') {
          setPopularRecipes(popularRes.value.data || []);
        }
        if (planRes.status === 'fulfilled') {
          setThisWeekPlan(planRes.value.data || null);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Failed to load home dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentMonday]);

  // Calculate planned meals count this week
  const plannedMealCount = (thisWeekPlan?.days || []).reduce(
    (acc, day) => acc + (day.meals?.length || 0),
    0
  );

  // Extract today's meals
  const todaysDayPlan = (thisWeekPlan?.days || []).find((d) => {
    const dStr = new Date(d.date).toISOString().split('T')[0];
    return dStr === todayDateStr;
  });
  const todaysMeals = todaysDayPlan?.meals || [];

  return (
    <div className="space-y-10">
      {/* Welcome Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-emerald-950 text-white p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-4 border border-white/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart College Meal Management Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Plan Better, Cook Smarter, Eat Fresh.
          </h1>

          <p className="mt-3 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl">
            Organize family and personal recipes, plan weekly meals with automated ingredient scaling,
            and generate intelligent grocery shopping checklists.
          </p>

          {/* Quick Action CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/recipes">
              <Button
                variant="secondary"
                size="md"
                icon={UtensilsCrossed}
                className="bg-white text-gray-900 hover:bg-emerald-50 border-transparent font-bold shadow-md"
              >
                Explore Recipes
              </Button>
            </Link>

            <Link to="/planner">
              <Button
                variant="outline"
                size="md"
                icon={CalendarDays}
                className="text-white border-white/30 hover:bg-white/10 hover:border-white"
              >
                Meal Planner
              </Button>
            </Link>

            <Link to="/grocery-list">
              <Button
                variant="ghost"
                size="md"
                icon={ShoppingCart}
                className="text-emerald-100 hover:text-white hover:bg-white/10"
              >
                Grocery List
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          <div>
            <span className="text-xs text-emerald-200/80 font-medium block">Total Recipes</span>
            <span className="text-2xl font-black tracking-tight">{totalRecipeCount || 24}</span>
          </div>
          <div>
            <span className="text-xs text-emerald-200/80 font-medium block">Your Favorites</span>
            <span className="text-2xl font-black tracking-tight">{favorites.length}</span>
          </div>
          <div>
            <span className="text-xs text-emerald-200/80 font-medium block">Scheduled Meals</span>
            <span className="text-2xl font-black tracking-tight">{plannedMealCount}</span>
          </div>
          <div>
            <span className="text-xs text-emerald-200/80 font-medium block">Current Week</span>
            <span className="text-sm font-bold truncate block mt-1">{formatWeekRange(currentMonday)}</span>
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      {/* Main Dashboard Layout */}
      {loading ? (
        <LoadingSpinner text="Loading your culinary dashboard..." />
      ) : (
        <div className="space-y-10">
          {/* Section: Today's Menu & Weekly Planner Overview */}
          <section className="bg-surface-card rounded-3xl border border-surface-border p-6 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-surface-border gap-2">
              <div>
                <h2 className="text-lg font-bold text-surface-text flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  This Week's Meal Schedule
                </h2>
                <p className="text-xs text-surface-muted">
                  {formatWeekRange(currentMonday)} • {plannedMealCount} meals scheduled
                </p>
              </div>

              <Link to="/planner">
                <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
                  Open Planner
                </Button>
              </Link>
            </div>

            {/* Quick Glance of Scheduled Days */}
            {plannedMealCount === 0 ? (
              <div className="text-center py-8 px-4 bg-surface-subtle rounded-2xl border border-dashed border-surface-border">
                <CalendarDays className="w-8 h-8 text-surface-muted mx-auto mb-2 opacity-60" />
                <h3 className="text-sm font-bold text-surface-text">No meals scheduled for this week yet</h3>
                <p className="text-xs text-surface-muted max-w-sm mx-auto mt-1 mb-4">
                  Add recipes to Breakfast, Lunch, Dinner, and Snack slots in the weekly meal planner.
                </p>
                <Link to="/planner">
                  <Button variant="primary" size="sm" icon={CalendarDays}>
                    Start Planning Meals
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {weekDays.map((d) => {
                  const dayPlan = (thisWeekPlan?.days || []).find((dp) => {
                    const dStr = new Date(dp.date).toISOString().split('T')[0];
                    return dStr === d.dateString;
                  });
                  const dayMeals = dayPlan?.meals || [];

                  return (
                    <div
                      key={d.dateString}
                      className={`
                        p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[110px]
                        ${
                          d.isToday
                            ? 'bg-brand-50/60 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 ring-1 ring-brand-400'
                            : 'bg-surface-subtle border-surface-border hover:border-brand-300'
                        }
                      `}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-surface-text">{d.short}</span>
                          {d.isToday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-brand-600 text-white">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-surface-muted block mb-2">{d.formattedDate}</span>
                      </div>

                      <div>
                        {dayMeals.length === 0 ? (
                          <span className="text-[11px] text-surface-muted/60 italic">No meals</span>
                        ) : (
                          <div className="space-y-1">
                            {dayMeals.slice(0, 2).map((m, mIdx) => (
                              <div
                                key={mIdx}
                                className="text-[11px] font-medium text-surface-text truncate bg-surface-card px-2 py-0.5 rounded-md border border-surface-border"
                              >
                                <span className="font-bold text-brand-600 dark:text-brand-400 mr-1">
                                  {m.mealType[0]}:
                                </span>
                                {m.recipeId ? m.recipeId.title : 'Recipe'}
                              </div>
                            ))}
                            {dayMeals.length > 2 && (
                              <span className="text-[10px] text-surface-muted font-bold block pl-1">
                                +{dayMeals.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section: Popular Recipes */}
          {popularRecipes.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-surface-text flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    Most Popular Recipes
                  </h2>
                  <p className="text-xs text-surface-muted">
                    Highly rated and frequently favorited community favorites.
                  </p>
                </div>

                <Link to="/recipes?sort=popularity">
                  <Button variant="ghost" size="sm" icon={ChevronRight} iconPosition="right">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularRecipes.slice(0, 3).map((recipe) => (
                  <RecipeCard key={recipe._id} recipe={recipe} showActions={false} />
                ))}
              </div>
            </section>
          )}

          {/* Section: Newest Recipes */}
          {newestRecipes.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-surface-text flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    Recently Added Recipes
                  </h2>
                  <p className="text-xs text-surface-muted">
                    Freshly curated recipes added to the collection.
                  </p>
                </div>

                <Link to="/recipes?sort=newest">
                  <Button variant="ghost" size="sm" icon={ChevronRight} iconPosition="right">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {newestRecipes.slice(0, 3).map((recipe) => (
                  <RecipeCard key={recipe._id} recipe={recipe} showActions={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
