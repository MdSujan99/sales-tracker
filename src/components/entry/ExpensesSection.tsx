import React, { useState } from 'react';
import type { ExpenseItem, ExpenseCategory } from '../../types/statement';
import { paiseToRupees, rupeesToPaise, formatPaiseToINR, calculateTotalExpenses } from '../../lib/calculations';
import { generateUuid, saveExpenseCategory, deleteExpenseCategory } from '../../lib/supabase';
import { ShoppingBag, Plus, Trash2, Tag, X } from 'lucide-react';

interface ExpensesSectionProps {
  expenses: ExpenseItem[];
  categories: ExpenseCategory[];
  onChange: (updated: ExpenseItem[]) => void;
  onAddCategory?: (newCategory: ExpenseCategory) => void;
  onRemoveCategory?: (categoryId: string) => void;
}

export const ExpensesSection: React.FC<ExpensesSectionProps> = ({
  expenses,
  categories,
  onChange,
  onAddCategory,
  onRemoveCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.name || 'Vegetables / Mandi'
  );
  const [newDescription, setNewDescription] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');

  // Custom Category Creation State (Triggered exclusively via dropdown)
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);

  const totalExpensesPaise = calculateTotalExpenses(expenses);

  // Show top 5 quick-add options (within the 3-6 range) to prevent clutter
  const quickAddCategories = categories.slice(0, 5);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError('Category name is required.');
      return;
    }

    try {
      setIsSavingCategory(true);
      setCategoryError(null);
      const saved = await saveExpenseCategory(trimmed);
      onAddCategory?.(saved);
      setSelectedCategory(saved.name);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (err: unknown) {
      setCategoryError(err instanceof Error ? err.message : 'Could not create category.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCustomCategory = async (cat: ExpenseCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cat.is_predefined) return;
    if (confirm(`Delete custom category "${cat.name}"?`)) {
      await deleteExpenseCategory(cat.id);
      onRemoveCategory?.(cat.id);
      if (selectedCategory === cat.name) {
        setSelectedCategory(categories[0]?.name || '');
      }
    }
  };

  const handleAddCustomExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || parseFloat(newAmount) <= 0) return;

    const matchedCat = categories.find(c => c.name === selectedCategory);
    const newEntry: ExpenseItem = {
      id: generateUuid(),
      category_id: matchedCat?.id,
      category_name: selectedCategory,
      description: newDescription.trim() || selectedCategory,
      amount_paise: rupeesToPaise(newAmount),
    };

    onChange([...expenses, newEntry]);
    setNewDescription('');
    setNewAmount('');
  };

  const handleQuickAddCategory = (cat: ExpenseCategory) => {
    const newEntry: ExpenseItem = {
      id: generateUuid(),
      category_id: cat.id,
      category_name: cat.name,
      description: '',
      amount_paise: 0,
    };
    onChange([...expenses, newEntry]);
  };

  const handleRemoveExpense = (id: string) => {
    onChange(expenses.filter(e => e.id !== id));
  };

  const handleUpdateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    onChange(
      expenses.map(e => {
        if (e.id === id) {
          return { ...e, ...updates };
        }
        return e;
      })
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 m-0">3. Daily Expenses</h2>
        </div>
        <div className="text-right">
          <span className="text-2xs text-slate-400 font-medium uppercase tracking-wider block">Total Expenses</span>
          <span className="text-base sm:text-lg font-black text-rose-700 tracking-tight">
            {formatPaiseToINR(totalExpensesPaise)}
          </span>
        </div>
      </div>

      {/* Collapsible Create Custom Category Form (Triggered via dropdown "+ New Category...") */}
      {isAddingCategory && (
        <form
          onSubmit={handleCreateCategory}
          className="mb-4 p-3 bg-rose-50/70 border border-rose-200 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-fade-in"
        >
          <div className="flex-1">
            <input
              type="text"
              value={newCategoryName}
              onChange={e => {
                setNewCategoryName(e.target.value);
                if (categoryError) setCategoryError(null);
              }}
              placeholder="Enter new category name..."
              className="w-full px-3 py-1.5 text-xs bg-white rounded border border-rose-300 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
              autoFocus
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={isSavingCategory}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isSavingCategory ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory(false);
                setCategoryError(null);
                setSelectedCategory(categories[0]?.name || '');
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
          {categoryError && (
            <p className="w-full text-2xs font-bold text-rose-600 m-0">{categoryError}</p>
          )}
        </form>
      )}

      {/* Quick Add Pills */}
      <div className="mb-4">
        <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Quick Add:
        </label>

        {/* Quick Add Badges (Limited to top 5 categories) */}
        <div className="flex flex-wrap gap-1.5">
          {quickAddCategories.map(cat => (
            <div key={cat.id} className="inline-flex items-center">
              <button
                type="button"
                onClick={() => handleQuickAddCategory(cat)}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  cat.is_predefined
                    ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border-slate-200'
                    : 'bg-rose-50/90 text-rose-800 hover:bg-rose-100 border-rose-300 font-semibold'
                }`}
              >
                <Plus className="w-3 h-3 mr-1" />
                {cat.name}
                {!cat.is_predefined && (
                  <span
                    onClick={e => handleDeleteCustomCategory(cat, e)}
                    className="ml-1.5 p-0.5 rounded-full hover:bg-rose-200 text-rose-500 hover:text-rose-800"
                    title="Delete category"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Line Form */}
      <form onSubmit={handleAddCustomExpense} className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          <div className="sm:col-span-4">
            <select
              value={isAddingCategory ? '__NEW__' : selectedCategory}
              onChange={e => {
                if (e.target.value === '__NEW__') {
                  setIsAddingCategory(true);
                } else {
                  setIsAddingCategory(false);
                  setSelectedCategory(e.target.value);
                }
              }}
              className="w-full px-2.5 py-2 bg-white text-xs rounded border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name} {!cat.is_predefined ? '(Custom)' : ''}
                </option>
              ))}
              <option value="__NEW__">+ New Category...</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <input
              type="text"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-2.5 py-2 bg-white text-xs rounded border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="sm:col-span-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-semibold pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="w-full pl-6 pr-2.5 py-2 bg-white text-sm rounded border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs flex items-center justify-center transition-colors shadow-xs"
              title="Add item"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Itemized List */}
      {expenses.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-xs text-slate-500 m-0">No expenses recorded</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
          {expenses.map((expense, idx) => (
            <div
              key={expense.id}
              className="p-3 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                <span className="text-2xs font-bold text-slate-400 w-4">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                      <Tag className="w-2.5 h-2.5 mr-1" />
                      {expense.category_name}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={expense.description}
                    onChange={e => handleUpdateExpense(expense.id, { description: e.target.value })}
                    placeholder="Add description..."
                    className="w-full mt-1 text-xs text-slate-700 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-rose-500 focus:outline-none focus:bg-white py-0.5"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <div className="relative w-32">
                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 text-xs font-semibold pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={expense.amount_paise ? paiseToRupees(expense.amount_paise) : ''}
                    onChange={e =>
                      handleUpdateExpense(expense.id, { amount_paise: rupeesToPaise(e.target.value) })
                    }
                    placeholder="0.00"
                    className="w-full pl-5 pr-2 py-1 text-sm bg-slate-50 rounded border border-slate-200 font-bold text-slate-900 text-right focus:outline-none focus:bg-white focus:border-rose-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExpense(expense.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Delete expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
