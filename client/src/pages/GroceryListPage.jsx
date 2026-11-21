import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import groceryListService from '../services/groceryListService';
import {
  getMondayString,
  shiftWeek,
  formatWeekRange,
} from '../utils/dateUtils';
import GroceryItemRow from '../components/grocery/GroceryItemRow';
import AddGroceryItemModal from '../components/grocery/AddGroceryItemModal';
import EditGroceryItemModal from '../components/grocery/EditGroceryItemModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import Button from '../components/common/Button';
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';

export default function GroceryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMonday = searchParams.get('week') || getMondayString();
  const [currentMonday, setCurrentMonday] = useState(initialMonday);

  const [groceryList, setGroceryList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const fetchGroceryList = useCallback(async (mondayStr) => {
    try {
      setLoading(true);
      setError(null);
      const res = await groceryListService.getGroceryList(mondayStr);
      setGroceryList(res.data || null);
    } catch (err) {
      if (err.status === 404) {
        // Documented missing list behavior
        setGroceryList(null);
      } else {
        console.error('Failed to load grocery list:', err);
        setError(err.message || 'Failed to load grocery list');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroceryList(currentMonday);
    setSearchParams({ week: currentMonday }, { replace: true });
  }, [currentMonday, fetchGroceryList, setSearchParams]);

  const handleWeekShift = (offset) => {
    const nextMonday = shiftWeek(currentMonday, offset);
    setCurrentMonday(nextMonday);
  };

  const handleJumpToCurrentWeek = () => {
    const thisMonday = getMondayString();
    setCurrentMonday(thisMonday);
  };

  // Generate / Regenerate from meal plan
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      const res = await groceryListService.generateGroceryList(currentMonday);
      setGroceryList(res.data);
    } catch (err) {
      console.error('Failed to generate grocery list:', err);
      if (err.status === 404) {
        setError('No meal plan exists for this week yet. Please add meals in the Meal Planner first.');
      } else {
        setError(err.message || 'Failed to generate grocery list from meal plan.');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Toggle purchased checkbox
  const handleTogglePurchased = async (itemId, newPurchased) => {
    if (!groceryList) return;
    try {
      // Optimistic local update
      setGroceryList((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it._id === itemId ? { ...it, isPurchased: newPurchased } : it
        ),
      }));

      await groceryListService.patchGroceryItem(groceryList._id, itemId, {
        isPurchased: newPurchased,
      });
    } catch (err) {
      console.error('Failed to update purchased status:', err);
      // Re-fetch to revert if failed
      fetchGroceryList(currentMonday);
    }
  };

  // Add custom grocery item
  const handleAddCustomItem = async (itemData) => {
    if (!groceryList) return;
    try {
      const res = await groceryListService.addGroceryItem(groceryList._id, itemData);
      setGroceryList(res.data);
      setIsAddOpen(false);
    } catch (err) {
      console.error('Failed to add custom item:', err);
      alert(err.message || 'Failed to add item');
    }
  };

  // Edit grocery item
  const handleEditItem = async (itemId, updates) => {
    if (!groceryList) return;
    try {
      const res = await groceryListService.patchGroceryItem(groceryList._id, itemId, updates);
      setGroceryList(res.data);
      setItemToEdit(null);
    } catch (err) {
      console.error('Failed to edit item:', err);
      alert(err.message || 'Failed to edit item');
    }
  };

  // Delete grocery item
  const handleDeleteItem = async (itemId) => {
    if (!groceryList) return;
    try {
      // Optimistic local delete
      setGroceryList((prev) => ({
        ...prev,
        items: prev.items.filter((it) => it._id !== itemId),
      }));

      await groceryListService.deleteGroceryItem(groceryList._id, itemId);
    } catch (err) {
      console.error('Failed to delete item:', err);
      fetchGroceryList(currentMonday);
    }
  };

  // Group items by category
  const categorizedItems = useMemo(() => {
    if (!groceryList || !Array.isArray(groceryList.items)) return {};

    const groups = {};
    for (const item of groceryList.items) {
      const cat = item.category || 'Other';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    }
    return groups;
  }, [groceryList]);

  // Overall completion metrics
  const totalItems = groceryList?.items?.length || 0;
  const purchasedItems = groceryList?.items?.filter((i) => i.isPurchased).length || 0;
  const progressPercent = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Smart Grocery List
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ingredients aggregated and scaled automatically from your weekly meal plan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {groceryList && (
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddOpen(true)}
            >
              Add Item
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            loading={generating}
            onClick={handleGenerate}
          >
            {groceryList ? 'Regenerate List' : 'Generate from Meals'}
          </Button>
        </div>
      </div>

      {/* Week Navigator Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="secondary"
            size="sm"
            icon={ChevronLeft}
            onClick={() => handleWeekShift(-1)}
          >
            Prev Week
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={handleJumpToCurrentWeek}
            className="text-xs font-semibold text-gray-600"
          >
            Current Week
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={ChevronRight}
            iconPosition="right"
            onClick={() => handleWeekShift(1)}
          >
            Next Week
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span>{formatWeekRange(currentMonday)}</span>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => fetchGroceryList(currentMonday)} />}

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner text="Loading grocery list..." fullScreen />
      ) : !groceryList || groceryList.items.length === 0 ? (
        <EmptyState
          title="No grocery list generated for this week"
          description="Plan your meals in the Weekly Meal Planner, then click 'Generate from Meals' to compile all ingredients into a checklist."
          icon={ShoppingCart}
          actionLabel="Go to Meal Planner"
          onAction={() => window.location.assign(`/planner?week=${currentMonday}`)}
          actionIcon={CalendarDays}
        />
      ) : (
        <div className="space-y-6">
          {/* Progress Banner */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Shopping Progress: {purchasedItems} of {totalItems} items ({progressPercent}%)
                </h3>
                <p className="text-xs text-gray-500">
                  Check off items as you shop in your local grocery or supermarket.
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full sm:w-48 bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Categorized Lists */}
          <div className="space-y-6">
            {Object.entries(categorizedItems).map(([category, items]) => {
              const catTotal = items.length;
              const catPurchased = items.filter((i) => i.isPurchased).length;

              return (
                <div
                  key={category}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{category}</span>
                      <span className="text-xs text-gray-400 font-medium">
                        ({items.length})
                      </span>
                    </div>

                    <span className="text-xs font-medium text-gray-500">
                      {catPurchased}/{catTotal} purchased
                    </span>
                  </div>

                  {/* Item Rows */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {items.map((item) => (
                      <GroceryItemRow
                        key={item._id}
                        item={item}
                        onTogglePurchased={handleTogglePurchased}
                        onEdit={(it) => setItemToEdit(it)}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Item Modal */}
      <AddGroceryItemModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddCustomItem}
      />

      {/* Edit Item Modal */}
      <EditGroceryItemModal
        isOpen={Boolean(itemToEdit)}
        onClose={() => setItemToEdit(null)}
        item={itemToEdit}
        onSave={handleEditItem}
      />
    </div>
  );
}
