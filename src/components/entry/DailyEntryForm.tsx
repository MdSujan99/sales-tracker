import React, { useState, useEffect } from 'react';
import type {
  DailyStatement,
  ExpenseCategory,
  SalesBreakdown,
  CashMemoItem,
  ExpenseItem,
} from '../../types/statement';
import { SalesChannelsSection } from './SalesChannelsSection';
import { CashMemosSection } from './CashMemosSection';
import { ExpensesSection } from './ExpensesSection';
import { ReconciliationBar } from './ReconciliationBar';
import {
  calculateTotalSales,
  calculateTotalExpenses,
  calculateTotalCashMemos,
  calculateNetDifference,
  reconcileStatement,
} from '../../lib/calculations';
import { saveStatementToDb, generateUuid } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Hash, CheckCircle } from 'lucide-react';

interface DailyEntryFormProps {
  initialStatement?: DailyStatement | null;
  categories: ExpenseCategory[];
  onStatementSaved: (statement: DailyStatement) => void;
  onViewSnapshot: (statement: DailyStatement) => void;
}

const LOCAL_DRAFT_KEY = 'restaurant_daily_statement_active_draft';

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({
  initialStatement,
  categories,
  onStatementSaved,
  onViewSnapshot,
}) => {
  const { restaurant, user } = useAuth();

  // Helper to get today's date in YYYY-MM-DD
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const createBlankStatement = (): DailyStatement => ({
    id: generateUuid(),
    restaurant_id: restaurant.id,
    business_date: getTodayDate(),
    statement_number: `ST-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-01`,
    status: 'DRAFT',
    cash_sales_paise: 0,
    upi_sales_paise: 0,
    card_sales_paise: 0,
    delivery_sales_paise: 0,
    other_sales_paise: 0,
    total_sales_paise: 0,
    cash_memos: [
      { id: generateUuid(), from_number: '', to_number: '', source: 'Counter / Dine-in', amount_paise: 0 },
    ],
    total_cash_memos_paise: 0,
    expense_entries: [],
    total_expenses_paise: 0,
    net_difference_paise: 0,
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [statement, setStatement] = useState<DailyStatement>(() => {
    if (initialStatement) return initialStatement;
    const savedDraft = localStorage.getItem(LOCAL_DRAFT_KEY);
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch {
        // Fallback
      }
    }
    return createBlankStatement();
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Auto-save active draft to localStorage
  useEffect(() => {
    if (statement.status === 'DRAFT') {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(statement));
    }
  }, [statement]);

  // If initialStatement prop changes (e.g. from history click), update form
  useEffect(() => {
    if (initialStatement) {
      setStatement(initialStatement);
    }
  }, [initialStatement]);

  // Derived live sums
  const salesBreakdown: SalesBreakdown = {
    cash_sales_paise: statement.cash_sales_paise,
    upi_sales_paise: statement.upi_sales_paise,
    card_sales_paise: statement.card_sales_paise,
    delivery_sales_paise: statement.delivery_sales_paise,
    other_sales_paise: statement.other_sales_paise,
  };

  const totalSalesPaise = calculateTotalSales(salesBreakdown);
  const totalExpensesPaise = calculateTotalExpenses(statement.expense_entries);
  const totalCashMemosPaise = calculateTotalCashMemos(statement.cash_memos);
  const netDifferencePaise = calculateNetDifference(totalSalesPaise, totalExpensesPaise);

  const reconciliation = reconcileStatement({
    ...statement,
    total_sales_paise: totalSalesPaise,
    total_expenses_paise: totalExpensesPaise,
    total_cash_memos_paise: totalCashMemosPaise,
  });

  const handleSalesChange = (sales: SalesBreakdown) => {
    setStatement(prev => {
      const newTotalSales = calculateTotalSales(sales);
      const newNet = calculateNetDifference(newTotalSales, prev.total_expenses_paise);
      return {
        ...prev,
        ...sales,
        total_sales_paise: newTotalSales,
        net_difference_paise: newNet,
        updated_at: new Date().toISOString(),
      };
    });
  };

  const handleMemosChange = (memos: CashMemoItem[]) => {
    setStatement(prev => {
      const newMemosTotal = calculateTotalCashMemos(memos);
      return {
        ...prev,
        cash_memos: memos,
        total_cash_memos_paise: newMemosTotal,
        updated_at: new Date().toISOString(),
      };
    });
  };

  const handleExpensesChange = (expenses: ExpenseItem[]) => {
    setStatement(prev => {
      const newExpTotal = calculateTotalExpenses(expenses);
      const newNet = calculateNetDifference(prev.total_sales_paise, newExpTotal);
      return {
        ...prev,
        expense_entries: expenses,
        total_expenses_paise: newExpTotal,
        net_difference_paise: newNet,
        updated_at: new Date().toISOString(),
      };
    });
  };

  const handleSave = async (statusToSet: 'DRAFT' | 'FINALIZED') => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const finalStatement: DailyStatement = {
      ...statement,
      status: statusToSet,
      total_sales_paise: totalSalesPaise,
      total_expenses_paise: totalExpensesPaise,
      total_cash_memos_paise: totalCashMemosPaise,
      net_difference_paise: netDifferencePaise,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const res = await saveStatementToDb(finalStatement);
    setIsSaving(false);

    if (res.success) {
      setStatement(finalStatement);
      onStatementSaved(finalStatement);
      if (statusToSet === 'FINALIZED') {
        localStorage.removeItem(LOCAL_DRAFT_KEY);
        setSaveSuccessMsg('Statement finalized and saved successfully!');
        setTimeout(() => {
          onViewSnapshot(finalStatement);
        }, 1200);
      } else {
        setSaveSuccessMsg('Draft saved successfully.');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } else {
      alert(`Could not save statement: ${res.error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center shadow-xs transition-all animate-fade-in">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Statement Header Card (Date & Statement #) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight m-0">
              Daily Cash Statement Entry
            </h1>
            <p className="text-xs text-slate-500 mt-1 m-0">
              Enter sales channels, cash memos, and itemized expenses
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Business Date */}
            <div>
              <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Business Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={statement.business_date}
                  onChange={e =>
                    setStatement(prev => ({
                      ...prev,
                      business_date: e.target.value,
                      statement_number: `ST-${e.target.value.slice(2).replace(/-/g, '')}-01`,
                    }))
                  }
                  className="pl-8 pr-2.5 py-1.5 bg-slate-50 text-xs font-bold text-slate-900 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Statement Number */}
            <div>
              <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Statement #
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={statement.statement_number}
                  onChange={e =>
                    setStatement(prev => ({ ...prev, statement_number: e.target.value }))
                  }
                  placeholder="ST-XXXX-01"
                  className="pl-7 pr-2.5 py-1.5 bg-slate-50 text-xs font-bold text-slate-900 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 w-32"
                />
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Sales Channels */}
      <SalesChannelsSection
        sales={salesBreakdown}
        onChange={handleSalesChange}
        enteredAccountSalesPaise={statement.entered_account_sales_paise}
        onEnteredAccountSalesChange={val =>
          setStatement(prev => ({ ...prev, entered_account_sales_paise: val }))
        }
      />

      {/* Section 2: Cash Memos */}
      <CashMemosSection memos={statement.cash_memos} onChange={handleMemosChange} />

      {/* Section 3: Itemized Expenses */}
      <ExpensesSection
        expenses={statement.expense_entries}
        categories={categories}
        onChange={handleExpensesChange}
        enteredAccountExpensesPaise={statement.entered_account_expenses_paise}
        onEnteredAccountExpensesChange={val =>
          setStatement(prev => ({ ...prev, entered_account_expenses_paise: val }))
        }
      />

      {/* Section 4: Summary & Reconciliation Bar */}
      <ReconciliationBar
        totalSalesPaise={totalSalesPaise}
        totalExpensesPaise={totalExpensesPaise}
        totalCashMemosPaise={totalCashMemosPaise}
        netDifferencePaise={netDifferencePaise}
        reconciliation={reconciliation}
        notes={statement.notes || ''}
        onNotesChange={notes => setStatement(prev => ({ ...prev, notes }))}
        onSaveDraft={() => handleSave('DRAFT')}
        onFinalize={() => handleSave('FINALIZED')}
        isSaving={isSaving}
        status={statement.status}
      />
    </div>
  );
};
