import React from 'react';
import type { ReconciliationResult } from '../../types/statement';
import { formatPaiseToINR } from '../../lib/calculations';
import { CheckCircle2, AlertTriangle, AlertCircle, Save, Check } from 'lucide-react';

interface ReconciliationBarProps {
  totalSalesPaise: number;
  totalExpensesPaise: number;
  totalCashMemosPaise: number;
  netDifferencePaise: number;
  reconciliation: ReconciliationResult;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSaveDraft: () => void;
  onFinalize: () => void;
  isSaving: boolean;
  status: 'DRAFT' | 'FINALIZED';
}

export const ReconciliationBar: React.FC<ReconciliationBarProps> = ({
  totalSalesPaise,
  totalExpensesPaise,
  totalCashMemosPaise,
  netDifferencePaise,
  reconciliation,
  notes,
  onNotesChange,
  onSaveDraft,
  onFinalize,
  isSaving,
  status,
}) => {
  return (
    <div className="space-y-4">
      {/* 4. Live Calculated Reconciliation Cards */}
      <div className="bg-slate-900 text-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4 m-0">
          4. Statement Summary & Reconciliation
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Total Sales */}
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Sales
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400 block mt-1">
              {formatPaiseToINR(totalSalesPaise)}
            </span>
          </div>

          {/* Total Expenses */}
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Expenses
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-rose-400 block mt-1">
              {formatPaiseToINR(totalExpensesPaise)}
            </span>
          </div>

          {/* Net Difference */}
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
              Net Diff (Sales - Exp)
            </span>
            <span
              className={`text-lg sm:text-xl font-extrabold block mt-1 ${
                netDifferencePaise >= 0 ? 'text-amber-400' : 'text-rose-500'
              }`}
            >
              {formatPaiseToINR(netDifferencePaise)}
            </span>
          </div>

          {/* Cash Memos */}
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
              Cash Memos Total
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-blue-400 block mt-1">
              {formatPaiseToINR(totalCashMemosPaise)}
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
              <span>Reconciliation Warnings:</span>
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
            <span>All figures balance cleanly with no discrepancies or warnings.</span>
          </div>
        )}

        {/* Notes input */}
        <div className="mt-4">
          <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Accountant / Manager Notes & Sign-off Remarks:
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Add any discrepancies, handovers, cash-in-hand adjustments, or remarks..."
            className="w-full px-3 py-2 bg-slate-800 text-xs rounded-md border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Sticky / Primary Action Buttons */}
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
          <span className="text-xs text-slate-500 hidden sm:inline">
            {status === 'FINALIZED' ? 'Locked & ready for print' : 'In-progress draft'}
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveDraft}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            disabled={isSaving || !reconciliation.isValid}
            onClick={onFinalize}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Finalize Statement
          </button>
        </div>
      </div>
    </div>
  );
};
