import { describe, it, expect } from 'vitest';
import {
  rupeesToPaise,
  paiseToRupees,
  formatPaiseToINR,
  calculateTotalSales,
  calculateCashSales,
  calculateCashInHand,
  calculateTotalExpenses,
  calculateTotalCashMemos,
  calculateNetDifference,
  reconcileStatement,
} from '../lib/calculations';
import type { DailyStatement } from '../types/statement';

describe('Integer Paise Conversions', () => {
  it('converts number rupees to paise without floating point issues', () => {
    expect(rupeesToPaise(100)).toBe(10000);
    expect(rupeesToPaise(150.50)).toBe(15050);
    expect(rupeesToPaise(0.10 + 0.20)).toBe(30); // 0.30000000000000004 avoided
    expect(rupeesToPaise(0)).toBe(0);
    expect(rupeesToPaise(null)).toBe(0);
    expect(rupeesToPaise(undefined)).toBe(0);
  });

  it('converts string rupees to paise cleanly', () => {
    expect(rupeesToPaise('1250.75')).toBe(125075);
    expect(rupeesToPaise('₹ 1,500.00')).toBe(150000);
    expect(rupeesToPaise('')).toBe(0);
  });

  it('converts paise to rupees accurately', () => {
    expect(paiseToRupees(15050)).toBe(150.5);
    expect(paiseToRupees(10000)).toBe(100);
    expect(paiseToRupees(0)).toBe(0);
  });

  it('formats paise to Indian Rupee currency format', () => {
    const formatted = formatPaiseToINR(12345650);
    // en-IN formatting gives ₹1,23,456.50
    expect(formatted).toContain('1,23,456.50');
  });
});

describe('Statement Calculations', () => {
  it('calculates total sales across channels when total_sales_paise is not set', () => {
    const total = calculateTotalSales({
      cash_sales_paise: 500000,     // ₹5,000
      upi_sales_paise: 800000,      // ₹8,000
      card_sales_paise: 200000,     // ₹2,000
      delivery_sales_paise: 350000, // ₹3,500
      other_sales_paise: 50000,     // ₹500
    });
    expect(total).toBe(1900000); // ₹19,000
  });

  it('uses explicitly provided total_sales_paise when entered directly', () => {
    const total = calculateTotalSales({
      total_sales_paise: 2500000,   // ₹25,000 entered
      cash_sales_paise: 1000000,
      upi_sales_paise: 800000,
      card_sales_paise: 400000,
      delivery_sales_paise: 300000,
      other_sales_paise: 0,
    });
    expect(total).toBe(2500000);
  });

  it('calculates derived cash sales (Total - NonCash channels)', () => {
    const totalSalesPaise = 2000000; // ₹20,000
    const nonCash = {
      delivery_sales_paise: 500000, // ₹5,000
      card_sales_paise: 300000,     // ₹3,000
      upi_sales_paise: 400000,      // ₹4,000
      other_sales_paise: 100000,    // ₹1,000
    };
    const cashSales = calculateCashSales(totalSalesPaise, nonCash);
    // 20000 - (5000 + 3000 + 4000 + 1000) = 7000 => 700000 paise
    expect(cashSales).toBe(700000);
  });

  it('calculates cash in hand (Cash Sales - Expenses)', () => {
    const cashSalesPaise = 700000; // ₹7,000
    const totalExpensesPaise = 250000; // ₹2,500
    const cashInHand = calculateCashInHand(cashSalesPaise, totalExpensesPaise);
    expect(cashInHand).toBe(450000); // ₹4,500
  });

  it('handles negative cash in hand when expenses exceed cash sales', () => {
    const cashSalesPaise = 200000; // ₹2,000
    const totalExpensesPaise = 350000; // ₹3,500
    const cashInHand = calculateCashInHand(cashSalesPaise, totalExpensesPaise);
    expect(cashInHand).toBe(-150000); // -₹1,500
  });

  it('calculates total expenses', () => {
    const expenses = [
      { id: '1', category_name: 'Vegetables', description: 'Mandi', amount_paise: 150000 },
      { id: '2', category_name: 'Gas', description: 'Commercial cylinder', amount_paise: 210000 },
      { id: '3', category_name: 'Labour', description: 'Helper daily wage', amount_paise: 60000 },
    ];
    expect(calculateTotalExpenses(expenses)).toBe(420000); // ₹4,200
  });

  it('calculates total cash memos', () => {
    const memos = [
      { id: '1', from_number: '101', to_number: '150', source: 'Dine-in', amount_paise: 350000 },
      { id: '2', from_number: '151', to_number: '175', source: 'Takeaway', amount_paise: 150000 },
    ];
    expect(calculateTotalCashMemos(memos)).toBe(500000); // ₹5,000
  });

  it('calculates net difference (Sales - Expenses)', () => {
    expect(calculateNetDifference(1900000, 420000)).toBe(1480000); // ₹14,800
  });
});

describe('Reconciliation & Sanity Checks', () => {
  it('detects inverted cash memo ranges', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '2026-11-02',
      cash_memos: [
        { id: '1', from_number: '200', to_number: '150', source: 'Dine-in', amount_paise: 10000 },
      ],
    };
    const result = reconcileStatement(statement);
    expect(result.warnings.some(w => w.includes('range inverted'))).toBe(true);
  });

  it('detects discrepancies between entered account sales and calculated sales', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '2026-11-02',
      cash_sales_paise: 500000, // ₹5,000
      upi_sales_paise: 500000,  // ₹5,000 -> Total calculated = ₹10,000
      entered_account_sales_paise: 1200000, // Written on paper as ₹12,000
    };
    const result = reconcileStatement(statement);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.salesDiscrepancyPaise).toBe(200000); // ₹2,000 difference
  });

  it('flags error when non-cash channels exceed total sales causing negative cash sales', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '2026-11-02',
      total_sales_paise: 1000000, // ₹10,000
      cash_sales_paise: -200000,  // -₹2,000 (Non-cash was ₹12,000)
    };
    const result = reconcileStatement(statement);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Derived Cash Sales cannot be negative'))).toBe(true);
  });

  it('flags warning when expenses exceed cash sales', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '2026-11-02',
      cash_sales_paise: 200000, // ₹2,000
      expense_entries: [
        { id: '1', category_name: 'Vegetables', description: '', amount_paise: 300000 }, // ₹3,000
      ],
    };
    const result = reconcileStatement(statement);
    expect(result.warnings.some(w => w.includes('Cash in hand is negative'))).toBe(true);
  });

  it('fails validation if business date is missing', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '',
    };
    const result = reconcileStatement(statement);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Business date is required.');
  });

  it('detects discrepancies between entered account expenses and calculated expenses', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '2026-11-02',
      entered_account_expenses_paise: 500000, // ₹5,000 on paper
      expense_entries: [
        { id: '1', category_name: 'Raw Material', description: '', amount_paise: 400000 }, // ₹4,000 itemized
      ],
    };
    const result = reconcileStatement(statement);
    expect(result.expenseDiscrepancyPaise).toBe(100000);
    expect(result.warnings.some(w => w.includes('Entered Account Expenses'))).toBe(true);
  });

  it('flags error when cash memo amount is negative', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '2026-11-02',
      cash_memos: [
        { id: '1', from_number: '1', to_number: '10', source: 'Dine-in', amount_paise: -500 },
      ],
    };
    const result = reconcileStatement(statement);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Cash memo amount cannot be negative.');
  });

  it('flags error when an itemized expense amount is negative', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '2026-11-02',
      expense_entries: [
        { id: '1', category_name: 'Fuel', description: 'Petrol', amount_paise: -10000 },
      ],
    };
    const result = reconcileStatement(statement);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('cannot have a negative amount'))).toBe(true);
  });

  it('warns when total cash memos exceed total calculated sales', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '2026-11-02',
      cash_sales_paise: 200000, // ₹2,000
      cash_memos: [
        { id: '1', from_number: '1', to_number: '10', source: 'Dine-in', amount_paise: 300000 }, // ₹3,000
      ],
    };
    const result = reconcileStatement(statement);
    expect(result.warnings.some(w => w.includes('Total cash memos'))).toBe(true);
  });

  it('warns when total sales recorded is 0 on a finalized statement', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '2026-11-02',
      status: 'FINALIZED',
      total_sales_paise: 0,
      cash_sales_paise: 0,
      upi_sales_paise: 0,
      card_sales_paise: 0,
      delivery_sales_paise: 0,
    };
    const result = reconcileStatement(statement);
    expect(result.warnings.some(w => w.includes('Total sales recorded is ₹0.00'))).toBe(true);
  });
});
