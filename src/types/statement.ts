export type StatementStatus = 'DRAFT' | 'FINALIZED';

export type UserRole = 'ACCOUNTANT' | 'OWNER' | 'ADMIN';

export interface SalesBreakdown {
  total_sales_paise?: number;
  cash_sales_paise: number;
  upi_sales_paise: number;
  card_sales_paise: number;
  delivery_sales_paise: number;
  other_sales_paise: number;
}

export interface CashMemoItem {
  id: string;
  from_number: string;
  to_number: string;
  source: string;
  amount_paise: number;
}

export interface ExpenseItem {
  id: string;
  category_id?: string;
  category_name: string;
  description: string;
  amount_paise: number;
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  is_predefined?: boolean;
}

export interface DailyStatement {
  id: string;
  restaurant_id: string;
  business_date: string; // YYYY-MM-DD
  statement_number: string;
  status: StatementStatus;
  
  // Sales
  cash_sales_paise: number;
  upi_sales_paise: number;
  card_sales_paise: number;
  delivery_sales_paise: number;
  other_sales_paise: number;
  total_sales_paise: number;
  
  // Cash Memos
  cash_memos: CashMemoItem[];
  total_cash_memos_paise: number;
  
  // Expenses
  expense_entries: ExpenseItem[];
  total_expenses_paise: number;
  
  // Summary & Reconciliation
  net_difference_paise: number; // total_sales - total_expenses
  cash_in_hand_paise?: number; // cash_sales - total_expenses
  entered_account_sales_paise?: number; // Optional entered total from paper
  entered_account_expenses_paise?: number; // Optional entered total from paper
  closing_cash_paise?: number;
  notes?: string;
  
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  salesDiscrepancyPaise?: number;
  expenseDiscrepancyPaise?: number;
}
