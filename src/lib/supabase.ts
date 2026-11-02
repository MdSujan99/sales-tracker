import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DailyStatement, ExpenseCategory } from '../types/statement';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project.supabase.co')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage keys for offline / unconfigured demo mode
const LOCAL_STORAGE_STATEMENTS_KEY = 'restaurant_daily_statements_v1';
const LOCAL_STORAGE_CATEGORIES_KEY = 'restaurant_expense_categories_v1';

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-1', name: 'Vegetables / Mandi', display_order: 1, is_active: true, is_predefined: true },
  { id: 'cat-2', name: 'Meat / Poultry / Fish', display_order: 2, is_active: true, is_predefined: true },
  { id: 'cat-3', name: 'Dairy / Milk / Paneer', display_order: 3, is_active: true, is_predefined: true },
  { id: 'cat-4', name: 'Bakery / Breads', display_order: 4, is_active: true, is_predefined: true },
  { id: 'cat-5', name: 'Gas / Commercial Cylinders', display_order: 5, is_active: true, is_predefined: true },
  { id: 'cat-6', name: 'Packaging & Disposables', display_order: 6, is_active: true, is_predefined: true },
  { id: 'cat-7', name: 'Daily Wages / Labour', display_order: 7, is_active: true, is_predefined: true },
  { id: 'cat-8', name: 'Maintenance & Repairs', display_order: 8, is_active: true, is_predefined: true },
  { id: 'cat-9', name: 'Cleaning & Sanitation', display_order: 9, is_active: true, is_predefined: true },
  { id: 'cat-10', name: 'Ice & Beverages', display_order: 10, is_active: true, is_predefined: true },
  { id: 'cat-11', name: 'Staff Tea & Refreshment', display_order: 11, is_active: true, is_predefined: true },
  { id: 'cat-12', name: 'Miscellaneous Cash Expenses', display_order: 12, is_active: true, is_predefined: true },
];

/**
 * Loads categories from Supabase, or falls back to localStorage / defaults.
 */
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as ExpenseCategory[];
      }
    } catch (err) {
      console.warn('Failed to fetch categories from Supabase, using local fallback:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // Fallback
    }
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Loads all daily statements from Supabase or localStorage.
 */
export async function getStatements(): Promise<DailyStatement[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: statements, error } = await supabase
        .from('daily_statements')
        .select(`
          *,
          cash_memos (*),
          expense_entries (*)
        `)
        .order('business_date', { ascending: false });

      if (!error && statements) {
        return statements as DailyStatement[];
      }
    } catch (err) {
      console.warn('Failed to fetch from Supabase, falling back to localStorage:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_STATEMENTS_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Saves or updates a daily statement.
 */
export async function saveStatementToDb(statement: DailyStatement): Promise<{ success: boolean; error?: string }> {
  // Always keep localStorage updated as immediate backup
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_STATEMENTS_KEY);
    let list: DailyStatement[] = existingStr ? JSON.parse(existingStr) : [];
    const index = list.findIndex(s => s.id === statement.id || s.business_date === statement.business_date);
    if (index >= 0) {
      list[index] = statement;
    } else {
      list.unshift(statement);
    }
    localStorage.setItem(LOCAL_STORAGE_STATEMENTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }

  // If Supabase is connected, persist remotely
  if (isSupabaseConfigured && supabase) {
    try {
      const {
        cash_memos,
        expense_entries,
        ...statementData
      } = statement;

      // 1. Upsert statement header
      const { error: stmtError } = await supabase
        .from('daily_statements')
        .upsert(statementData, { onConflict: 'restaurant_id,business_date' });

      if (stmtError) throw stmtError;

      // 2. Delete and re-insert cash memos
      await supabase.from('cash_memos').delete().eq('statement_id', statement.id);
      if (cash_memos && cash_memos.length > 0) {
        const memosToInsert = cash_memos.map(m => ({
          ...m,
          statement_id: statement.id,
        }));
        const { error: memoError } = await supabase.from('cash_memos').insert(memosToInsert);
        if (memoError) throw memoError;
      }

      // 3. Delete and re-insert expense entries
      await supabase.from('expense_entries').delete().eq('statement_id', statement.id);
      if (expense_entries && expense_entries.length > 0) {
        const expensesToInsert = expense_entries.map(e => ({
          ...e,
          statement_id: statement.id,
        }));
        const { error: expError } = await supabase.from('expense_entries').insert(expensesToInsert);
        if (expError) throw expError;
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown database error';
      console.error('Supabase persistence error:', message);
      return { success: false, error: message };
    }
  }

  return { success: true };
}

/**
 * Deletes a statement by ID.
 */
export async function deleteStatementFromDb(id: string): Promise<boolean> {
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_STATEMENTS_KEY);
    if (existingStr) {
      let list: DailyStatement[] = JSON.parse(existingStr);
      list = list.filter(s => s.id !== id);
      localStorage.setItem(LOCAL_STORAGE_STATEMENTS_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('daily_statements').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  return true;
}
