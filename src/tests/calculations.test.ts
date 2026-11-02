import { describe, it, expect } from 'vitest';
import {
  rupeesToPaise,
  paiseToRupees,
  formatPaiseToINR,
  calculateTotalSales,
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
  it('calculates total sales across channels', () => {
    const total = calculateTotalSales({
      cash_sales_paise: 500000,     // ₹5,000
      upi_sales_paise: 800000,      // ₹8,000
      card_sales_paise: 200000,     // ₹2,000
      delivery_sales_paise: 350000, // ₹3,500
      other_sales_paise: 50000,     // ₹500
    });
    expect(total).toBe(1900000); // ₹19,000
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

  it('fails validation if business date is missing', () => {
    const statement: Partial<DailyStatement> = {
      business_date: '',
    };
    const result = reconcileStatement(statement);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Business date is required.');
  });
});
