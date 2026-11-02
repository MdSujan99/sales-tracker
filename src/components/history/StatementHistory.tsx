import React, { useState } from 'react';
import type { DailyStatement } from '../../types/statement';
import { formatPaiseToINR } from '../../lib/calculations';
import {
  Search,
  Calendar,
  FileText,
  Edit,
  Copy,
  Trash2,
  Download,
  Filter,
} from 'lucide-react';

interface StatementHistoryProps {
  statements: DailyStatement[];
  onOpenStatement: (statement: DailyStatement) => void;
  onViewSnapshot: (statement: DailyStatement) => void;
  onDuplicateStatement: (statement: DailyStatement) => void;
  onDeleteStatement: (id: string) => void;
}

export const StatementHistory: React.FC<StatementHistoryProps> = ({
  statements,
  onOpenStatement,
  onViewSnapshot,
  onDuplicateStatement,
  onDeleteStatement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FINALIZED' | 'DRAFT'>('ALL');

  const filteredStatements = statements.filter(stmt => {
    const matchesQuery =
      stmt.statement_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stmt.business_date.includes(searchQuery) ||
      (stmt.notes && stmt.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || stmt.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const handleExportCSV = () => {
    if (statements.length === 0) return;

    const headers = [
      'Business Date',
      'Statement Number',
      'Status',
      'Cash Sales (INR)',
      'UPI Sales (INR)',
      'Card Sales (INR)',
      'Delivery Sales (INR)',
      'Total Sales (INR)',
      'Total Expenses (INR)',
      'Net Difference (INR)',
      'Notes',
    ];

    const rows = statements.map(s => [
      s.business_date,
      s.statement_number,
      s.status,
      (s.cash_sales_paise / 100).toFixed(2),
      (s.upi_sales_paise / 100).toFixed(2),
      (s.card_sales_paise / 100).toFixed(2),
      (s.delivery_sales_paise / 100).toFixed(2),
      (s.total_sales_paise / 100).toFixed(2),
      (s.total_expenses_paise / 100).toFixed(2),
      (s.net_difference_paise / 100).toFixed(2),
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `restaurant-sales-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-900 tracking-tight m-0">
            Statement History
          </h1>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search date, statement #, or notes..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {(['ALL', 'FINALIZED', 'DRAFT'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded text-2xs font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statements List */}
      {filteredStatements.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-slate-800 m-0">No statements found</h2>
          <p className="text-xs text-slate-500 mt-1 m-0">
            {statements.length === 0
              ? 'Complete and save your first daily statement in the Daily Entry tab.'
              : 'Try clearing your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStatements.map(stmt => (
            <div
              key={stmt.id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    {stmt.statement_number}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold ${
                      stmt.status === 'FINALIZED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {stmt.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {new Date(stmt.business_date + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>{stmt.expense_entries?.length || 0} expenses</span>
                </div>

                {stmt.notes && (
                  <p className="text-xs text-slate-600 italic line-clamp-1 m-0">
                    "{stmt.notes}"
                  </p>
                )}
              </div>

              {/* Financial Metrics */}
              <div className="flex items-center space-x-6 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 self-start md:self-auto">
                <div>
                  <span className="text-2xs uppercase text-slate-400 font-bold block">Sales</span>
                  <span className="text-xs font-bold text-emerald-700 block">
                    {formatPaiseToINR(stmt.total_sales_paise)}
                  </span>
                </div>
                <div>
                  <span className="text-2xs uppercase text-slate-400 font-bold block">Expenses</span>
                  <span className="text-xs font-bold text-rose-700 block">
                    {formatPaiseToINR(stmt.total_expenses_paise)}
                  </span>
                </div>
                <div>
                  <span className="text-2xs uppercase text-slate-400 font-bold block">Net</span>
                  <span className="text-xs font-black text-slate-900 block">
                    {formatPaiseToINR(stmt.net_difference_paise)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => onViewSnapshot(stmt)}
                  className="p-2 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Print Snapshot"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenStatement(stmt)}
                  className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit statement"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onDuplicateStatement(stmt)}
                  className="p-2 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Duplicate for today"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete statement "${stmt.statement_number}"?`)) {
                      onDeleteStatement(stmt.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete statement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
