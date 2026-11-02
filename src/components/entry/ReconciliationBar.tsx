import React from 'react';
import type { ReconciliationResult } from '../../types/statement';
import { formatPaiseToINR } from '../../lib/calculations';
import { CheckCircle2, AlertTriangle, AlertCircle, Save, Check, Wallet, Banknote, Unlock } from 'lucide-react';

interface ReconciliationBarProps {
  totalSalesPaise: number;
  cashSalesPaise: number;
  cashInHandPaise: number;
  totalExpensesPaise: number;
  totalCashMemosPaise: number;
  netDifferencePaise: number;
  reconciliation: ReconciliationResult;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSaveDraft: () => void;
  onFinalize: () => void;
  onUnlock?: () => void;
  isSaving: boolean;
  status: 'DRAFT' | 'FINALIZED';
  isConflict?: boolean;
}

export const ReconciliationBar: React.FC<ReconciliationBarProps> = ({
  totalSalesPaise,
  cashSalesPaise,
  cashInHandPaise,
  totalExpensesPaise,
  totalCashMemosPaise,
  netDifferencePaise,
  reconciliation,
  notes,
  onNotesChange,
  onSaveDraft,
  onFinalize,
  onUnlock,
  isSaving,
  status,
  isConflict = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Statement Summary & Reconciliation Header */}
      <div className="bg-slate-900 text-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="pb-3 border-b border-slate-800 mb-4">
          <h2 className="text-xs uppercase tracking-wider font-extrabold text-amber-400 m-0">
            4. Summary & Reconciliation
          </h2>
        </div>

        {/* 6 Key Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 mb-6">
          {/* Total Sales */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Sales
            </span>
            <span className="text-base sm:text-lg font-black text-amber-400 block mt-1">
              {formatPaiseToINR(totalSalesPaise)}
            </span>
          </div>

          {/* Cash Sales (Derived) */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center">
              <Banknote className="w-3 h-3 mr-1 text-emerald-400" />
              Cash Sales
            </span>
            <span
              className={`text-base sm:text-lg font-black block mt-1 ${
                cashSalesPaise >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatPaiseToINR(cashSalesPaise)}
            </span>
          </div>

          {/* Total Expenses */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Expenses
            </span>
            <span className="text-base sm:text-lg font-black text-rose-400 block mt-1">
              {formatPaiseToINR(totalExpensesPaise)}
            </span>
          </div>

          {/* Cash in Hand -> Highlighted Hero Card */}
          <div className="bg-gradient-to-br from-emerald-950/70 to-slate-800 p-3 rounded-lg border-2 border-emerald-500/80 shadow-xs relative">
            <span className="text-2xs font-black text-emerald-300 uppercase tracking-wider block flex items-center">
              <Wallet className="w-3 h-3 mr-1 text-emerald-400" />
              Cash in Hand
            </span>
            <span
              className={`text-base sm:text-lg font-black block mt-1 ${
                cashInHandPaise >= 0 ? 'text-emerald-300' : 'text-rose-400'
              }`}
            >
              {formatPaiseToINR(cashInHandPaise)}
            </span>
          </div>

          {/* Cash Memos */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
              Cash Memos
            </span>
            <span className="text-base sm:text-lg font-black text-blue-400 block mt-1">
              {formatPaiseToINR(totalCashMemosPaise)}
            </span>
          </div>

          {/* Net Diff */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
              Net Revenue
            </span>
            <span
              className={`text-base sm:text-lg font-black block mt-1 ${
                netDifferencePaise >= 0 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {formatPaiseToINR(netDifferencePaise)}
            </span>
          </div>
        </div>

        {/* Warnings & Sanity feedback */}
        {reconciliation.errors.length > 0 && (
          <div className="mb-4 bg-rose-950/80 border border-rose-800/80 rounded-lg p-3 text-xs text-rose-200">
            <div className="flex items-center space-x-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Blocking Errors:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {reconciliation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {reconciliation.warnings.length > 0 && (
          <div className="mb-4 bg-amber-950/80 border border-amber-800/80 rounded-lg p-3 text-xs text-amber-200">
            <div className="flex items-center space-x-2 font-bold mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Warnings:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {reconciliation.warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {reconciliation.isValid && reconciliation.warnings.length === 0 && (
          <div className="mb-4 bg-emerald-950/60 border border-emerald-800/60 rounded-lg p-2.5 text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>All figures balanced.</span>
          </div>
        )}

        {/* Notes input */}
        <div className="mt-4">
          <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Notes & Remarks:
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Add any remarks, handovers, or discrepancy notes..."
            className="w-full px-3 py-2 bg-slate-800 text-xs rounded-md border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="sticky bottom-3 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
              status === 'FINALIZED'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          {status === 'FINALIZED' ? (
            onUnlock && (
              <button
                type="button"
                onClick={onUnlock}
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors"
              >
                <Unlock className="w-3.5 h-3.5 mr-1.5" />
                Unlock to Edit
              </button>
            )
          ) : (
            <>
              <button
                type="button"
                disabled={isSaving || isConflict}
                onClick={onSaveDraft}
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                disabled={isSaving || !reconciliation.isValid || isConflict}
                onClick={onFinalize}
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Finalize Statement
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
