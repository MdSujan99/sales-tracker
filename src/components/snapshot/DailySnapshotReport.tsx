import React from 'react';
import type { DailyStatement } from '../../types/statement';
import { formatPaiseToINR } from '../../lib/calculations';
import { useAuth } from '../../context/AuthContext';
import { Printer, Edit3, ArrowLeft } from 'lucide-react';

interface DailySnapshotReportProps {
  statement: DailyStatement;
  onEdit: () => void;
  onBack: () => void;
}

export const DailySnapshotReport: React.FC<DailySnapshotReportProps> = ({
  statement,
  onEdit,
  onBack,
}) => {
  const { restaurant } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(statement.business_date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Control Action Bar (Screen Only - Hidden in Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Entry
        </button>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            Edit Statement
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRINTABLE A4 STATEMENT SHEET */}
      {/* ============================================================== */}
      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-xs border border-slate-200 print:border-0 print:p-0 print:shadow-none print-card">
        {/* Statement Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide m-0">
            {restaurant.name}
          </h1>
          <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest mt-1 m-0">
            {restaurant.branch} • Daily Cash & Sales Statement
          </p>

          <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Business Date: </span>
              <span className="font-bold text-slate-900">{formattedDate}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Statement #: </span>
              <span className="font-bold text-slate-900">{statement.statement_number}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Status: </span>
              <span
                className={`font-black uppercase px-2 py-0.5 rounded text-2xs ${
                  statement.status === 'FINALIZED'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {statement.status}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Sales Channel Breakdown */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded-t border border-slate-300 m-0 print:bg-slate-200">
            1. Sales Breakdown
          </h2>
          <table className="w-full text-xs border border-t-0 border-slate-300 divide-y divide-slate-200">
            <tbody>
              <tr className="bg-amber-50/70 font-black border-b border-amber-200 print:bg-slate-100">
                <td className="p-2 text-amber-950 uppercase font-black">
                  Total Daily Sales (Register / POS Grand Total)
                </td>
                <td className="p-2 text-right text-amber-950 text-sm font-black">
                  {formatPaiseToINR(statement.total_sales_paise)}
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="p-2 font-medium text-slate-700">Online Delivery (Zomato / Swiggy)</td>
                <td className="p-2 text-right font-bold text-slate-900">
                  {formatPaiseToINR(statement.delivery_sales_paise)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-slate-700">Card / POS Settlements</td>
                <td className="p-2 text-right font-bold text-slate-900">
                  {formatPaiseToINR(statement.card_sales_paise)}
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="p-2 font-medium text-slate-700">UPI / QR Payments (GPay / PhonePe)</td>
                <td className="p-2 text-right font-bold text-slate-900">
                  {formatPaiseToINR(statement.upi_sales_paise)}
                </td>
              </tr>
              {statement.other_sales_paise > 0 && (
                <tr>
                  <td className="p-2 font-medium text-slate-700">Other / Credit Sales</td>
                  <td className="p-2 text-right font-bold text-slate-900">
                    {formatPaiseToINR(statement.other_sales_paise)}
                  </td>
                </tr>
              )}
              <tr className="bg-emerald-50 font-black border-t-2 border-slate-300 print:bg-slate-200">
                <td className="p-2 text-emerald-950 uppercase">
                  Derived Cash Sales <span className="text-2xs font-normal text-emerald-800">(Total Sales − Non-Cash Channels)</span>
                </td>
                <td className="p-2 text-right text-emerald-950 text-sm font-black">
                  {formatPaiseToINR(statement.cash_sales_paise)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Cash Memos */}
        {statement.cash_memos && statement.cash_memos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded-t border border-slate-300 m-0 print:bg-slate-200">
              2. Cash Memos / Bill Ranges
            </h2>
            <table className="w-full text-xs border border-t-0 border-slate-300 divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold text-2xs uppercase">
                  <th className="p-2 text-left">Source / Book</th>
                  <th className="p-2 text-center">From #</th>
                  <th className="p-2 text-center">To #</th>
                  <th className="p-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {statement.cash_memos.map((memo, idx) => (
                  <tr key={memo.id || idx}>
                    <td className="p-2 font-medium text-slate-800">{memo.source || 'General'}</td>
                    <td className="p-2 text-center text-slate-600">{memo.from_number || '-'}</td>
                    <td className="p-2 text-center text-slate-600">{memo.to_number || '-'}</td>
                    <td className="p-2 text-right font-bold text-slate-900">
                      {formatPaiseToINR(memo.amount_paise)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-black border-t-2 border-slate-300 print:bg-slate-100">
                  <td colSpan={3} className="p-2 text-blue-950 uppercase">
                    Total Cash Memos
                  </td>
                  <td className="p-2 text-right text-blue-950 text-sm">
                    {formatPaiseToINR(statement.total_cash_memos_paise)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Section 3: Itemized Expenses */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded-t border border-slate-300 m-0 print:bg-slate-200">
            3. Itemized Expenses
          </h2>
          {statement.expense_entries && statement.expense_entries.length > 0 ? (
            <table className="w-full text-xs border border-t-0 border-slate-300 divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold text-2xs uppercase">
                  <th className="p-2 text-left w-8">#</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {statement.expense_entries.map((exp, idx) => (
                  <tr key={exp.id || idx}>
                    <td className="p-2 text-slate-400 font-mono text-2xs">{idx + 1}</td>
                    <td className="p-2 font-bold text-slate-800">{exp.category_name}</td>
                    <td className="p-2 text-slate-600">{exp.description || '-'}</td>
                    <td className="p-2 text-right font-bold text-slate-900">
                      {formatPaiseToINR(exp.amount_paise)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-rose-50 font-black border-t-2 border-slate-300 print:bg-slate-100">
                  <td colSpan={3} className="p-2 text-rose-950 uppercase">
                    Total Expenses
                  </td>
                  <td className="p-2 text-right text-rose-950 text-sm">
                    {formatPaiseToINR(statement.total_expenses_paise)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="p-3 border border-t-0 border-slate-300 text-xs text-slate-500 italic">
              No expenses recorded.
            </div>
          )}
        </div>

        {/* Section 4: Summary Reconciliation Balancing */}
        {(() => {
          const cashInHandPaise =
            statement.cash_in_hand_paise ??
            (statement.cash_sales_paise - statement.total_expenses_paise);

          return (
            <div className="mb-6 bg-slate-50 border border-slate-300 rounded p-4 print:bg-white print:border-2 print:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-center">
                <div>
                  <span className="text-2xs font-semibold uppercase text-slate-500 block">Total Sales</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block mt-0.5">
                    {formatPaiseToINR(statement.total_sales_paise)}
                  </span>
                </div>
                <div>
                  <span className="text-2xs font-semibold uppercase text-slate-500 block">Cash Sales</span>
                  <span className="text-sm sm:text-base font-black text-emerald-700 block mt-0.5">
                    {formatPaiseToINR(statement.cash_sales_paise)}
                  </span>
                </div>
                <div>
                  <span className="text-2xs font-semibold uppercase text-slate-500 block">Total Expenses</span>
                  <span className="text-sm sm:text-base font-black text-rose-700 block mt-0.5">
                    {formatPaiseToINR(statement.total_expenses_paise)}
                  </span>
                </div>
                <div className="bg-emerald-100/70 border border-emerald-300 rounded p-1.5 print:bg-slate-100 print:border-slate-400">
                  <span className="text-2xs font-black uppercase text-emerald-950 block">
                    Cash in Hand
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-900 block mt-0.5">
                    {formatPaiseToINR(cashInHandPaise)}
                  </span>
                  <span className="text-3xs text-emerald-800 font-semibold block">
                    Cash Sales − Exp
                  </span>
                </div>
                <div>
                  <span className="text-2xs font-semibold uppercase text-slate-500 block">Net Difference</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block mt-0.5">
                    {formatPaiseToINR(statement.net_difference_paise)}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Notes */}
        {statement.notes && (
          <div className="mb-8 p-3 border border-slate-200 rounded text-xs">
            <span className="font-bold text-slate-700 block mb-1">Remarks & Adjustments:</span>
            <p className="text-slate-600 whitespace-pre-wrap m-0">{statement.notes}</p>
          </div>
        )}

        {/* Section 5: Signatures / Handover Block */}
        <div className="pt-6 border-t border-slate-300">
          <div className="mb-6 p-2.5 bg-slate-100 border border-slate-300 rounded text-center text-xs print:bg-white print:border-slate-400">
            <span className="font-semibold text-slate-700">Closing Cash in Hand for Drawer / Handover: </span>
            <span className="font-black text-slate-950 text-sm">
              {formatPaiseToINR(
                statement.cash_in_hand_paise ??
                  (statement.cash_sales_paise - statement.total_expenses_paise)
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="border-t border-dashed border-slate-400 pt-2 text-center">
              <span className="block font-bold text-slate-800">Prepared by Accountant</span>
              <span className="block text-2xs text-slate-400 mt-0.5">Signature & Stamp</span>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-2 text-center">
              <span className="block font-bold text-slate-800">Verified by Owner / Manager</span>
              <span className="block text-2xs text-slate-400 mt-0.5">Signature & Stamp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
