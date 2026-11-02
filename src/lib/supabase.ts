import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DailyStatement, ExpenseCategory } from '../types/statement';

/**
 * Sanitizes and normalizes Supabase Project URL to prevent "Invalid path specified in request URL".
 */
export function sanitizeSupabaseUrl(url: string | undefined): string {
  if (!url) return '';
  let cleaned = url.trim();
  // Strip outer quotes if copied with quotes in Vercel
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  // If user accidentally copied the browser dashboard URL:
  // e.g. https://supabase.com/dashboard/project/abcdefghijk
  const dashMatch = cleaned.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashMatch) {
    return `https://${dashMatch[1]}.supabase.co`;
  }

  // If user appended /rest/v1 or /rest or /api
  cleaned = cleaned.replace(/\/(rest(\/v1)?|api(\/v1)?)$/i, '');
  // Strip trailing slashes again
  cleaned = cleaned.replace(/\/+$/, '');

  return cleaned;
}

export function sanitizeAnonKey(key: string | undefined): string {
  if (!key) return '';
  return key.trim().replace(/^['"]+|['"]+$/g, '');
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = sanitizeAnonKey(rawSupabaseAnonKey);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project.supabase.co') &&
  supabaseUrl.startsWith('https://')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// UUID validation and generation helpers
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(str: string | null | undefined): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str);
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Default Restaurant ID
export const DEFAULT_RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';

// LocalStorage keys for offline / unconfigured demo mode
const LOCAL_STORAGE_STATEMENTS_KEY = 'restaurant_daily_statements_v1';
const LOCAL_STORAGE_CATEGORIES_KEY = 'restaurant_expense_categories_v1';

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'Vegetables / Mandi', display_order: 1, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000002', name: 'Meat / Poultry / Fish', display_order: 2, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000003', name: 'Dairy / Milk / Paneer', display_order: 3, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000004', name: 'Bakery / Breads', display_order: 4, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000005', name: 'Gas / Commercial Cylinders', display_order: 5, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Packaging & Disposables', display_order: 6, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000007', name: 'Daily Wages / Labour', display_order: 7, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000008', name: 'Maintenance & Repairs', display_order: 8, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000009', name: 'Cleaning & Sanitation', display_order: 9, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000010', name: 'Ice & Beverages', display_order: 10, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000011', name: 'Staff Tea & Refreshment', display_order: 11, is_active: true, is_predefined: true },
  { id: '11111111-0000-0000-0000-000000000012', name: 'Miscellaneous Cash Expenses', display_order: 12, is_active: true, is_predefined: true },
];

/**
 * Extracts a readable error message from Supabase or Postgrest error objects.
 */
function extractErrorMessage(err: unknown): string {
  if (!err) return 'Unknown database error';
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const errorObj = err as Record<string, unknown>;
    if (errorObj.message) {
      return `${errorObj.message}${errorObj.details ? ` (${errorObj.details})` : ''}${errorObj.hint ? ` [Hint: ${errorObj.hint}]` : ''}`;
    }
    if (errorObj.error_description) return String(errorObj.error_description);
  }
  return JSON.stringify(err);
}

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
        // Cache locally for offline access
        localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(data));
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
 * Creates and persists a new custom expense category.
 */
export async function saveExpenseCategory(name: string): Promise<ExpenseCategory> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Category name cannot be empty');
  }

  // Get current categories
  const currentCategories = await getExpenseCategories();
  const existing = currentCategories.find(
    c => c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const maxOrder = currentCategories.reduce((max, c) => Math.max(max, c.display_order || 0), 0);
  const newCat: ExpenseCategory = {
    id: generateUuid(),
    name: trimmedName,
    display_order: maxOrder + 1,
    is_active: true,
    is_predefined: false,
  };

  const updatedCategories = [...currentCategories, newCat];
  localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(updatedCategories));

  // If Supabase is connected, persist to remote DB
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('expense_categories').insert({
        id: newCat.id,
        restaurant_id: DEFAULT_RESTAURANT_ID,
        name: newCat.name,
        display_order: newCat.display_order,
        is_active: true,
      });
    } catch (err) {
      console.warn('Could not persist category to Supabase:', err);
    }
  }

  return newCat;
}

/**
 * Deletes a custom expense category (predefined categories cannot be deleted).
 */
export async function deleteExpenseCategory(id: string): Promise<boolean> {
  const currentCategories = await getExpenseCategories();
  const cat = currentCategories.find(c => c.id === id);
  if (!cat || cat.is_predefined) {
    return false;
  }

  const filtered = currentCategories.filter(c => c.id !== id);
  localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(filtered));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('expense_categories').delete().eq('id', id);
    } catch (err) {
      console.warn('Could not delete category from Supabase:', err);
    }
  }

  return true;
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
 * Saves or updates a daily statement with complete UUID validation and error reporting.
 */
export async function saveStatementToDb(statement: DailyStatement): Promise<{ success: boolean; error?: string }> {
  // Ensure the statement has a valid UUID
  const validStatementId = isValidUuid(statement.id) ? statement.id : generateUuid();
  const validRestaurantId = isValidUuid(statement.restaurant_id) ? statement.restaurant_id : DEFAULT_RESTAURANT_ID;

  const normalizedStatement: DailyStatement = {
    ...statement,
    id: validStatementId,
    restaurant_id: validRestaurantId,
    // Only pass created_by if it's a valid Supabase auth UUID, else null
    created_by: isValidUuid(statement.created_by) ? statement.created_by : undefined,
    cash_memos: (statement.cash_memos || []).map(m => ({
      ...m,
      id: isValidUuid(m.id) ? m.id : generateUuid(),
    })),
    expense_entries: (statement.expense_entries || []).map(e => ({
      ...e,
      id: isValidUuid(e.id) ? e.id : generateUuid(),
      category_id: isValidUuid(e.category_id) ? e.category_id : undefined,
    })),
  };

  // Validate for duplicate statement on the same business date (different ID)
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_STATEMENTS_KEY);
    const existingList: DailyStatement[] = existingStr ? JSON.parse(existingStr) : [];
    const conflict = existingList.find(
      s => s.business_date === normalizedStatement.business_date && s.id !== normalizedStatement.id
    );
    if (conflict) {
      return {
        success: false,
        error: `A statement for ${normalizedStatement.business_date} already exists (${conflict.statement_number || 'ST'}). Only one statement per business date is allowed.`,
      };
    }
  } catch {
    // Ignore localStorage parse errors
  }

  // Always keep localStorage updated as immediate backup
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_STATEMENTS_KEY);
    let list: DailyStatement[] = existingStr ? JSON.parse(existingStr) : [];
    const index = list.findIndex(s => s.id === normalizedStatement.id || s.business_date === normalizedStatement.business_date);
    if (index >= 0) {
      list[index] = normalizedStatement;
    } else {
      list.unshift(normalizedStatement);
    }
    localStorage.setItem(LOCAL_STORAGE_STATEMENTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }

  // If Supabase is connected, persist remotely
  if (isSupabaseConfigured && supabase) {
    try {
      // Check for remote date collisions with a different statement ID
      const { data: existingRows } = await supabase
        .from('daily_statements')
        .select('id, statement_number, status')
        .eq('restaurant_id', validRestaurantId)
        .eq('business_date', normalizedStatement.business_date);

      if (existingRows && existingRows.length > 0) {
        const conflictingRemote = existingRows.find(r => r.id !== validStatementId);
        if (conflictingRemote) {
          return {
            success: false,
            error: `A ${conflictingRemote.status.toLowerCase()} statement (${conflictingRemote.statement_number}) already exists in the database for ${normalizedStatement.business_date}. Duplicate daily statements are not allowed.`,
          };
        }
      }
      const {
        cash_memos,
        expense_entries,
        created_by,
        ...statementData
      } = normalizedStatement;

      // 1. Upsert statement header
      const payload: Record<string, unknown> = {
        ...statementData,
        id: validStatementId,
        restaurant_id: validRestaurantId,
        created_by: isValidUuid(created_by) ? created_by : null,
      };

      const { error: stmtError } = await supabase
        .from('daily_statements')
        .upsert(payload, { onConflict: 'restaurant_id,business_date' });

      if (stmtError) throw stmtError;

      // 2. Delete existing cash memos for this statement and re-insert
      await supabase.from('cash_memos').delete().eq('statement_id', validStatementId);
      if (cash_memos && cash_memos.length > 0) {
        const memosToInsert = cash_memos.map(m => ({
          id: isValidUuid(m.id) ? m.id : generateUuid(),
          statement_id: validStatementId,
          from_number: m.from_number || '',
          to_number: m.to_number || '',
          source: m.source || '',
          amount_paise: m.amount_paise || 0,
        }));
        const { error: memoError } = await supabase.from('cash_memos').insert(memosToInsert);
        if (memoError) throw memoError;
      }

      // 3. Delete existing expenses for this statement and re-insert
      await supabase.from('expense_entries').delete().eq('statement_id', validStatementId);
      if (expense_entries && expense_entries.length > 0) {
        const expensesToInsert = expense_entries.map(e => ({
          id: isValidUuid(e.id) ? e.id : generateUuid(),
          statement_id: validStatementId,
          category_id: isValidUuid(e.category_id) ? e.category_id : null,
          category_name: e.category_name,
          description: e.description || '',
          amount_paise: e.amount_paise || 0,
          notes: e.notes || null,
        }));
        const { error: expError } = await supabase.from('expense_entries').insert(expensesToInsert);
        if (expError) throw expError;
      }

      return { success: true };
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
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
