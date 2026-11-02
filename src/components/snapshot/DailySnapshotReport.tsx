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

  const [year, month, day] = statement.business_date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  const cashInHandPaise =
    statement.cash_in_hand_paise ??
    (statement.cash_sales_paise - statement.total_expenses_paise);

  return (
    <div className="max-w-2xl mx-auto pb-16 font-mono print:max-w-xl print:mx-auto print:pb-0">
      {/* Control Action Bar */}
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
            className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-black shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* PRINTABLE A4 STATEMENT SHEET - MINIMAL B/W MONOSPACE */}
      <div className="bg-white p-6 sm:p-8 rounded border border-black print:border-0 print:p-0 print:shadow-none print-card text-black font-mono">
        {/* Statement Header */}
        <div className="border-b-2 border-black pb-3 mb-4 text-center">
          <h1 className="text-xl font-bold uppercase tracking-wider m-0 text-black">
            {restaurant.name}
          </h1>
          <p className="text-xs uppercase tracking-widest mt-0.5 m-0 text-black font-medium">
            {restaurant.branch} • DAILY CASH STATEMENT
          </p>

          <div className="flex flex-wrap items-center justify-between mt-3 pt-2 border-t border-black text-xs font-medium">
            <div>
              <span>DATE: </span>
              <span className="font-bold">{formattedDate}</span>
            </div>
            <div>
              <span>STMT #: </span>
              <span className="font-bold">{statement.statement_number}</span>
            </div>
            <div>
              <span>STATUS: </span>
              <span className="font-bold uppercase">
                [{statement.status}]
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Sales Channel Breakdown */}
        <div className="mb-4 print-section">
          <div className="border-b border-black pb-1 mb-1 font-bold text-xs uppercase tracking-wider">
            1. SALES BREAKDOWN
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-black font-bold">
                <td className="py-1 uppercase">TOTAL DAILY SALES</td>
                <td className="py-1 text-right">
                  {formatPaiseToINR(statement.total_sales_paise)}
                </td>
              </tr>
              <tr className="border-b border-black/20">
                <td className="py-1 pl-2">Online Delivery</td>
                <td className="py-1 text-right font-medium">
                  {formatPaiseToINR(statement.delivery_sales_paise)}
                </td>
              </tr>
              <tr className="border-b border-black/20">
                <td className="py-1 pl-2">Card</td>
                <td className="py-1 text-right font-medium">
                  {formatPaiseToINR(statement.card_sales_paise)}
                </td>
              </tr>
              <tr className="border-b border-black/20">
                <td className="py-1 pl-2">UPI</td>
                <td className="py-1 text-right font-medium">
                  {formatPaiseToINR(statement.upi_sales_paise)}
                </td>
              </tr>
              {statement.other_sales_paise > 0 && (
                <tr className="border-b border-black/20">
                  <td className="py-1 pl-2">Other</td>
                  <td className="py-1 text-right font-medium">
                    {formatPaiseToINR(statement.other_sales_paise)}
                  </td>
                </tr>
              )}
              <tr className="border-t border-b border-black font-bold">
                <td className="py-1 uppercase">CASH SALES</td>
                <td className="py-1 text-right">
                  {formatPaiseToINR(statement.cash_sales_paise)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Cash Memos */}
        {statement.cash_memos && statement.cash_memos.length > 0 && (
          <div className="mb-4 print-section">
            <div className="border-b border-black pb-1 mb-1 font-bold text-xs uppercase tracking-wider">
              2. CASH MEMOS
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-black text-2xs uppercase">
                  <th className="py-1 text-left">Source / Book</th>
                  <th className="py-1 text-center">From #</th>
                  <th className="py-1 text-center">To #</th>
                  <th className="py-1 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {statement.cash_memos.map((memo, idx) => (
                  <tr key={memo.id || idx} className="border-b border-black/20">
                    <td className="py-1">{memo.source || 'General'}</td>
                    <td className="py-1 text-center">{memo.from_number || '-'}</td>
                    <td className="py-1 text-center">{memo.to_number || '-'}</td>
                    <td className="py-1 text-right font-medium">
                      {formatPaiseToINR(memo.amount_paise)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-b border-black font-bold">
                  <td colSpan={3} className="py-1 uppercase">
                    TOTAL CASH MEMOS
                  </td>
                  <td className="py-1 text-right">
                    {formatPaiseToINR(statement.total_cash_memos_paise)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Section 3: Itemized Expenses */}
        <div className="mb-4 print-section">
          <div className="border-b border-black pb-1 mb-1 font-bold text-xs uppercase tracking-wider">
            3. EXPENSES
          </div>
          {statement.expense_entries && statement.expense_entries.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-black text-2xs uppercase">
                  <th className="py-1 text-left w-6">#</th>
                  <th className="py-1 text-left">Category</th>
                  <th className="py-1 text-left">Description</th>
                  <th className="py-1 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {statement.expense_entries.map((exp, idx) => (
                  <tr key={exp.id || idx} className="border-b border-black/20">
                    <td className="py-1 text-2xs">{idx + 1}</td>
                    <td className="py-1 font-medium">{exp.category_name}</td>
                    <td className="py-1">{exp.description || '-'}</td>
                    <td className="py-1 text-right font-medium">
                      {formatPaiseToINR(exp.amount_paise)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-b border-black font-bold">
                  <td colSpan={3} className="py-1 uppercase">
                    TOTAL EXPENSES
                  </td>
                  <td className="py-1 text-right">
                    {formatPaiseToINR(statement.total_expenses_paise)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="py-1 text-xs italic">
              No expenses recorded.
            </div>
          )}
        </div>

        {/* Section 4: Summary Balances */}
        <div className="mb-4 print-section border border-black p-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div>
              <span className="text-2xs uppercase block">Total Sales</span>
              <span className="font-bold block">
                {formatPaiseToINR(statement.total_sales_paise)}
              </span>
            </div>
            <div>
              <span className="text-2xs uppercase block">Cash Sales</span>
              <span className="font-bold block">
                {formatPaiseToINR(statement.cash_sales_paise)}
              </span>
            </div>
            <div>
              <span className="text-2xs uppercase block">Total Expenses</span>
              <span className="font-bold block">
                {formatPaiseToINR(statement.total_expenses_paise)}
              </span>
            </div>
            <div className="border border-black p-1">
              <span className="text-2xs uppercase font-bold block">
                Cash in Hand
              </span>
              <span className="font-bold block">
                {formatPaiseToINR(cashInHandPaise)}
              </span>
            </div>
            <div>
              <span className="text-2xs uppercase block">Net Diff</span>
              <span className="font-bold block">
                {formatPaiseToINR(statement.net_difference_paise)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {statement.notes && (
          <div className="mb-4 print-section border border-black p-2 text-xs">
            <span className="font-bold block mb-0.5">REMARKS & ADJUSTMENTS:</span>
            <p className="whitespace-pre-wrap m-0">{statement.notes}</p>
          </div>
        )}

        {/* Section 5: Signatures / Handover Block */}
        <div className="print-section pt-3 border-t border-black">
          <div className="mb-4 p-2 border border-black text-center text-xs">
            <span className="font-medium uppercase">CLOSING CASH IN HAND (HANDOVER): </span>
            <span className="font-bold">
              {formatPaiseToINR(cashInHandPaise)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs pt-2">
            <div className="border-t border-dashed border-black pt-1 text-center">
              <span className="block font-bold">PREPARED BY</span>
              <span className="block text-2xs mt-0.5">Signature & Stamp</span>
            </div>
            <div className="border-t border-dashed border-black pt-1 text-center">
              <span className="block font-bold">VERIFIED / APPROVED BY</span>
              <span className="block text-2xs mt-0.5">Signature & Stamp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
