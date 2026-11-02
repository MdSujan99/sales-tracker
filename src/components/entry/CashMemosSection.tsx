import React from 'react';
import type { CashMemoItem } from '../../types/statement';
import { paiseToRupees, rupeesToPaise, formatPaiseToINR, calculateTotalCashMemos } from '../../lib/calculations';
import { generateUuid } from '../../lib/supabase';
import { Receipt, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface CashMemosSectionProps {
  memos: CashMemoItem[];
  onChange: (updated: CashMemoItem[]) => void;
}

export const CashMemosSection: React.FC<CashMemosSectionProps> = ({ memos, onChange }) => {
  const totalMemosPaise = calculateTotalCashMemos(memos);

  const handleAddMemo = () => {
    const newMemo: CashMemoItem = {
      id: generateUuid(),
      from_number: '',
      to_number: '',
      source: 'Counter',
      amount_paise: 0,
    };
    onChange([...memos, newMemo]);
  };

  const handleRemoveMemo = (id: string) => {
    onChange(memos.filter(m => m.id !== id));
  };

  const handleUpdateMemo = (id: string, updates: Partial<CashMemoItem>) => {
    onChange(
      memos.map(m => {
        if (m.id === id) {
          return { ...m, ...updates };
        }
        return m;
      })
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
            <Receipt className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 m-0">2. Cash Memos</h2>
        </div>
        <div className="text-right">
          <span className="text-2xs text-slate-400 font-medium uppercase tracking-wider block">Total Memos</span>
          <span className="text-base sm:text-lg font-black text-blue-700 tracking-tight">
            {formatPaiseToINR(totalMemosPaise)}
          </span>
        </div>
      </div>

      {memos.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-xs text-slate-500 mb-2">No cash memos recorded</p>
          <button
            type="button"
            onClick={handleAddMemo}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Cash Memo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {memos.map((memo) => {
            const fromNum = parseInt(memo.from_number, 10);
            const toNum = parseInt(memo.to_number, 10);
            const isInverted = !isNaN(fromNum) && !isNaN(toNum) && toNum < fromNum;

            return (
              <div
                key={memo.id}
                className={`p-3 rounded-lg border transition-all ${
                  isInverted
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  <div className="sm:col-span-3">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Source / Book
                    </label>
                    <input
                      type="text"
                      value={memo.source}
                      onChange={e => handleUpdateMemo(memo.id, { source: e.target.value })}
                      placeholder="e.g. Counter, Dine-in"
                      className="w-full px-2.5 py-1.5 bg-white text-xs rounded border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      From #
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={memo.from_number}
                      onChange={e => handleUpdateMemo(memo.id, { from_number: e.target.value })}
                      placeholder="Start #"
                      className="w-full px-2.5 py-1.5 bg-white text-xs rounded border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      To #
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={memo.to_number}
                      onChange={e => handleUpdateMemo(memo.id, { to_number: e.target.value })}
                      placeholder="End #"
                      className={`w-full px-2.5 py-1.5 bg-white text-xs rounded border font-medium text-slate-800 focus:outline-none focus:ring-1 ${
                        isInverted ? 'border-amber-400 focus:ring-amber-500' : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-semibold pointer-events-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={memo.amount_paise ? paiseToRupees(memo.amount_paise) : ''}
                        onChange={e =>
                          handleUpdateMemo(memo.id, { amount_paise: rupeesToPaise(e.target.value) })
                        }
                        placeholder="0.00"
                        className="w-full pl-6 pr-2.5 py-1.5 bg-white text-sm rounded border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-1 flex items-end justify-center sm:justify-end pt-1 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveMemo(memo.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Remove memo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isInverted && (
                  <div className="mt-2 flex items-center text-xs text-amber-700 bg-amber-100/70 px-2 py-1 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                    <span>Range check: To # ({memo.to_number}) is less than From # ({memo.from_number})</span>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddMemo}
            className="w-full py-2 border border-dashed border-blue-300 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Cash Memo</span>
          </button>
        </div>
      )}
    </div>
  );
};
