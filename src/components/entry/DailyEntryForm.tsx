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
  calculateCashInHand,
  reconcileStatement,
} from '../../lib/calculations';
import { saveStatementToDb, generateUuid } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Hash,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Lock,
  Unlock,
  PlusCircle,
  X,
  ExternalLink,
} from 'lucide-react';

interface DailyEntryFormProps {
  initialStatement?: DailyStatement | null;
  existingStatements?: DailyStatement[];
  categories: ExpenseCategory[];
  onAddCategory?: (category: ExpenseCategory) => void;
  onRemoveCategory?: (categoryId: string) => void;
  onStatementSaved: (statement: DailyStatement) => void;
  onViewSnapshot: (statement: DailyStatement) => void;
  onOpenStatement?: (statement: DailyStatement) => void;
  onCreateNewStatement?: () => void;
}

const LOCAL_DRAFT_KEY = 'restaurant_daily_statement_active_draft';

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({
  initialStatement,
  existingStatements = [],
  categories,
  onAddCategory,
  onRemoveCategory,
  onStatementSaved,
  onViewSnapshot,
  onOpenStatement,
  onCreateNewStatement,
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
    cash_in_hand_paise: 0,
    closing_cash_paise: 0,
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
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Auto-save active draft to localStorage if it's a DRAFT
  useEffect(() => {
    if (statement.status === 'DRAFT') {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(statement));
    }
  }, [statement]);

  // If initialStatement prop changes (e.g. from history click or auto-load), update form
  useEffect(() => {
    if (initialStatement) {
      setStatement(initialStatement);
      setSaveErrorMsg(null);
    }
  }, [initialStatement]);

  // Check if another statement already exists for the selected business date
  const conflictingStatement = existingStatements.find(
    s => s.business_date === statement.business_date && s.id !== statement.id
  );

  // Derived live sums
  const salesBreakdown: SalesBreakdown = {
    total_sales_paise: statement.total_sales_paise,
    cash_sales_paise: statement.cash_sales_paise,
    upi_sales_paise: statement.upi_sales_paise,
    card_sales_paise: statement.card_sales_paise,
    delivery_sales_paise: statement.delivery_sales_paise,
    other_sales_paise: statement.other_sales_paise,
  };

  const totalSalesPaise = statement.total_sales_paise || calculateTotalSales(salesBreakdown);
  const totalExpensesPaise = calculateTotalExpenses(statement.expense_entries);
  const totalCashMemosPaise = calculateTotalCashMemos(statement.cash_memos);
  const netDifferencePaise = calculateNetDifference(totalSalesPaise, totalExpensesPaise);
  const cashInHandPaise = calculateCashInHand(statement.cash_sales_paise, totalExpensesPaise);

  const baseReconciliation = reconcileStatement({
    ...statement,
    total_sales_paise: totalSalesPaise,
    cash_sales_paise: statement.cash_sales_paise,
    total_expenses_paise: totalExpensesPaise,
    total_cash_memos_paise: totalCashMemosPaise,
  });

  const reconciliation = {
    ...baseReconciliation,
    isValid: baseReconciliation.isValid && !conflictingStatement,
    errors: [
      ...baseReconciliation.errors,
      ...(conflictingStatement
        ? [
            `Date Conflict: A ${conflictingStatement.status.toLowerCase()} statement (${conflictingStatement.statement_number}) already exists for ${statement.business_date}. Only one statement per calendar day is permitted.`,
          ]
        : []),
    ],
  };

  const handleSalesChange = (sales: SalesBreakdown) => {
    setStatement(prev => {
      const newTotalSales = sales.total_sales_paise ?? calculateTotalSales(sales);
      const newCashSales = sales.cash_sales_paise;
      const newNet = calculateNetDifference(newTotalSales, prev.total_expenses_paise);
      const newCashInHand = calculateCashInHand(newCashSales, prev.total_expenses_paise);
      return {
        ...prev,
        ...sales,
        total_sales_paise: newTotalSales,
        cash_sales_paise: newCashSales,
        net_difference_paise: newNet,
        cash_in_hand_paise: newCashInHand,
        closing_cash_paise: newCashInHand,
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
      const newCashInHand = calculateCashInHand(prev.cash_sales_paise, newExpTotal);
      return {
        ...prev,
        expense_entries: expenses,
        total_expenses_paise: newExpTotal,
        net_difference_paise: newNet,
        cash_in_hand_paise: newCashInHand,
        closing_cash_paise: newCashInHand,
        updated_at: new Date().toISOString(),
      };
    });
  };

  const handleSave = async (statusToSet: 'DRAFT' | 'FINALIZED') => {
    if (conflictingStatement) {
      setSaveErrorMsg(
        `Cannot save statement: A ${conflictingStatement.status.toLowerCase()} statement (${conflictingStatement.statement_number}) already exists for ${statement.business_date}. Only one statement per business date is permitted.`
      );
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    const finalStatement: DailyStatement = {
      ...statement,
      status: statusToSet,
      total_sales_paise: totalSalesPaise,
      cash_sales_paise: statement.cash_sales_paise,
      total_expenses_paise: totalExpensesPaise,
      total_cash_memos_paise: totalCashMemosPaise,
      net_difference_paise: netDifferencePaise,
      cash_in_hand_paise: cashInHandPaise,
      closing_cash_paise: cashInHandPaise,
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
      setSaveErrorMsg(res.error || 'Could not save statement.');
    }
  };

  const handleUnlockStatement = () => {
    if (window.confirm('Do you want to unlock this statement to make corrections? You can edit figures and re-finalize once balanced.')) {
      setStatement(prev => ({
        ...prev,
        status: 'DRAFT',
        updated_at: new Date().toISOString(),
      }));
      setSaveSuccessMsg('Statement unlocked. You can now edit figures and re-finalize.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  const handleOpenExisting = (target: DailyStatement) => {
    if (onOpenStatement) {
      onOpenStatement(target);
    } else {
      setStatement(target);
    }
    setSaveErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Toast Notification - Success */}
      {saveSuccessMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center shadow-xs transition-all animate-fade-in">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Toast Notification - Save Error */}
      {saveErrorMsg && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-start justify-between shadow-xs transition-all animate-fade-in">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 m-0">Failed to Save Statement</p>
              <p className="text-xs text-rose-700 mt-0.5 m-0 font-normal">{saveErrorMsg}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700 ml-3 p-0.5 rounded transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Date Collision Warning Banner (Only 1 statement per day allowed) */}
      {conflictingStatement && (
        <div className={`mb-6 p-4 rounded-xl border shadow-xs ${
          conflictingStatement.status === 'FINALIZED'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              {conflictingStatement.status === 'FINALIZED' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div>
                <h3 className="text-sm font-bold m-0">
                  {conflictingStatement.status === 'FINALIZED'
                    ? 'Statement Already Finalized for this Date'
                    : 'Draft Statement Already Exists for this Date'}
                </h3>
                <p className={`text-xs mt-1 m-0 ${
                  conflictingStatement.status === 'FINALIZED' ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  A {conflictingStatement.status.toLowerCase()} statement (
                  <span className="font-mono font-bold">{conflictingStatement.statement_number}</span>
                  ) already exists for <span className="font-bold">{statement.business_date}</span>. To preserve cash book consistency, each day can only have one statement.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleOpenExisting(conflictingStatement)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors shadow-xs ${
                  conflictingStatement.status === 'FINALIZED'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Open Existing Statement
              </button>

              {conflictingStatement.status === 'FINALIZED' && (
                <button
                  type="button"
                  onClick={() => onViewSnapshot(conflictingStatement)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-rose-700 hover:bg-rose-100 border border-rose-300 transition-colors inline-flex items-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Snapshot
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statement Locked Banner (When currently viewing a finalized statement) */}
      {!conflictingStatement && statement.status === 'FINALIZED' && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs text-emerald-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold m-0">
                    Statement Finalized & Signed Off
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded text-2xs font-bold font-mono">
                    {statement.statement_number}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-1 m-0">
                  This statement for <span className="font-bold">{statement.business_date}</span> is finalized. Figures are locked to maintain physical cash book integrity.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onViewSnapshot(statement)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors inline-flex items-center shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                View Snapshot
              </button>

              <button
                type="button"
                onClick={handleUnlockStatement}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors inline-flex items-center shadow-xs"
              >
                <Unlock className="w-3.5 h-3.5 mr-1.5" />
                Unlock to Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statement Header Card (Date & Statement #) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-black text-slate-900 tracking-tight m-0">
                Daily Cash Statement Entry
              </h1>
              {onCreateNewStatement && (
                <button
                  type="button"
                  onClick={onCreateNewStatement}
                  className="inline-flex items-center px-2.5 py-1 text-2xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                  title="Start a new daily statement for another date"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  New Date Entry
                </button>
              )}
            </div>
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
                  onChange={e => {
                    const newDate = e.target.value;
                    setStatement(prev => ({
                      ...prev,
                      business_date: newDate,
                      statement_number: `ST-${newDate.slice(2).replace(/-/g, '')}-01`,
                    }));
                    setSaveErrorMsg(null);
                  }}
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
        onAddCategory={onAddCategory}
        onRemoveCategory={onRemoveCategory}
        onChange={handleExpensesChange}
        enteredAccountExpensesPaise={statement.entered_account_expenses_paise}
        onEnteredAccountExpensesChange={val =>
          setStatement(prev => ({ ...prev, entered_account_expenses_paise: val }))
        }
      />

      {/* Section 4: Summary & Reconciliation Bar */}
      <ReconciliationBar
        totalSalesPaise={totalSalesPaise}
        cashSalesPaise={statement.cash_sales_paise}
        cashInHandPaise={cashInHandPaise}
        totalExpensesPaise={totalExpensesPaise}
        totalCashMemosPaise={totalCashMemosPaise}
        netDifferencePaise={netDifferencePaise}
        reconciliation={reconciliation}
        notes={statement.notes || ''}
        onNotesChange={notes => setStatement(prev => ({ ...prev, notes }))}
        onSaveDraft={() => handleSave('DRAFT')}
        onFinalize={() => handleSave('FINALIZED')}
        onUnlock={handleUnlockStatement}
        isSaving={isSaving}
        status={statement.status}
        isConflict={Boolean(conflictingStatement)}
      />
    </div>
  );
};
