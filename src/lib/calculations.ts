import type {
  DailyStatement,
  ExpenseItem,
  CashMemoItem,
  SalesBreakdown,
  ReconciliationResult,
} from '../types/statement';

/**
 * Converts a rupee amount (number or string, e.g. 150.50 or "1,250.75")
 * safely into integer paise without floating-point artifacts.
 */
export function rupeesToPaise(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined) return 0;
  if (typeof amount === 'number') {
    if (isNaN(amount) || !isFinite(amount)) return 0;
    return Math.round(amount * 100);
  }
  
  // Clean string: remove commas, currency symbols, and extra spaces
  const cleanStr = amount.replace(/[^0-9.-]/g, '').trim();
  if (!cleanStr) return 0;
  
  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Converts integer paise back to rupees (e.g., 15050 -> 150.5).
 */
export function paiseToRupees(paise: number): number {
  if (!paise || isNaN(paise)) return 0;
  return paise / 100;
}

/**
 * Formats integer paise into Indian Rupee currency string (e.g. ₹1,23,450.00).
 */
export function formatPaiseToINR(paise: number, showDecimals: boolean = true): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Calculates sum of all confirmed sales channels in integer paise.
 */
export function calculateTotalSales(sales: SalesBreakdown): number {
  return (
    (sales.cash_sales_paise || 0) +
    (sales.upi_sales_paise || 0) +
    (sales.card_sales_paise || 0) +
    (sales.delivery_sales_paise || 0) +
    (sales.other_sales_paise || 0)
  );
}

/**
 * Calculates total expenses in integer paise.
 */
export function calculateTotalExpenses(expenses: ExpenseItem[]): number {
  if (!expenses || !Array.isArray(expenses)) return 0;
  return expenses.reduce((sum, item) => sum + (item.amount_paise || 0), 0);
}

/**
 * Calculates total cash memos in integer paise.
 */
export function calculateTotalCashMemos(memos: CashMemoItem[]): number {
  if (!memos || !Array.isArray(memos)) return 0;
  return memos.reduce((sum, item) => sum + (item.amount_paise || 0), 0);
}

/**
 * Calculates Net Difference: Total Sales - Total Expenses.
 */
export function calculateNetDifference(totalSalesPaise: number, totalExpensesPaise: number): number {
  return (totalSalesPaise || 0) - (totalExpensesPaise || 0);
}

/**
 * Runs reconciliation and sanity checks against the statement.
 */
export function reconcileStatement(statement: Partial<DailyStatement>): ReconciliationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!statement.business_date) {
    errors.push('Business date is required.');
  }

  // Calculate actual sums
  const calculatedSales = calculateTotalSales({
    cash_sales_paise: statement.cash_sales_paise || 0,
    upi_sales_paise: statement.upi_sales_paise || 0,
    card_sales_paise: statement.card_sales_paise || 0,
    delivery_sales_paise: statement.delivery_sales_paise || 0,
    other_sales_paise: statement.other_sales_paise || 0,
  });

  const calculatedExpenses = calculateTotalExpenses(statement.expense_entries || []);
  const calculatedMemos = calculateTotalCashMemos(statement.cash_memos || []);

  if (calculatedMemos > calculatedSales && calculatedSales > 0) {
    warnings.push(
      `Total cash memos (${formatPaiseToINR(calculatedMemos)}) exceeds total calculated sales (${formatPaiseToINR(calculatedSales)}).`
    );
  }

  // Check sales discrepancies if entered separately on paper
  if (statement.entered_account_sales_paise !== undefined && statement.entered_account_sales_paise > 0) {
    const diff = statement.entered_account_sales_paise - calculatedSales;
    if (diff !== 0) {
      warnings.push(
        `Entered Account Sales (${formatPaiseToINR(statement.entered_account_sales_paise)}) differs from sum of sales channels (${formatPaiseToINR(calculatedSales)}) by ${formatPaiseToINR(Math.abs(diff))}.`
      );
    }
  }

  // Check expense discrepancies if entered separately on paper
  if (statement.entered_account_expenses_paise !== undefined && statement.entered_account_expenses_paise > 0) {
    const diff = statement.entered_account_expenses_paise - calculatedExpenses;
    if (diff !== 0) {
      warnings.push(
        `Entered Account Expenses (${formatPaiseToINR(statement.entered_account_expenses_paise)}) differs from itemized expenses total (${formatPaiseToINR(calculatedExpenses)}) by ${formatPaiseToINR(Math.abs(diff))}.`
      );
    }
  }

  // Check cash memos
  if (statement.cash_memos && statement.cash_memos.length > 0) {
    for (const memo of statement.cash_memos) {
      const fromNum = parseInt(memo.from_number, 10);
      const toNum = parseInt(memo.to_number, 10);
      if (!isNaN(fromNum) && !isNaN(toNum) && toNum < fromNum) {
        warnings.push(
          `Cash memo range inverted: "To" (${memo.to_number}) is less than "From" (${memo.from_number}).`
        );
      }
      if (memo.amount_paise < 0) {
        errors.push(`Cash memo amount cannot be negative.`);
      }
    }
  }

  // Check expenses for negatives
  if (statement.expense_entries) {
    for (const expense of statement.expense_entries) {
      if (expense.amount_paise < 0) {
        errors.push(`Expense "${expense.description || expense.category_name}" cannot have a negative amount.`);
      }
    }
  }

  // Check zero total sales
  if (calculatedSales === 0 && statement.status === 'FINALIZED') {
    warnings.push('Total sales recorded is ₹0.00 for this finalized statement.');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    salesDiscrepancyPaise: statement.entered_account_sales_paise
      ? statement.entered_account_sales_paise - calculatedSales
      : undefined,
    expenseDiscrepancyPaise: statement.entered_account_expenses_paise
      ? statement.entered_account_expenses_paise - calculatedExpenses
      : undefined,
  };
}
