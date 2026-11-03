import React, { useState, useMemo } from 'react';
import type { DailyStatement } from '../../types/statement';
import { formatPaiseToINR, paiseToRupees } from '../../lib/calculations';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Calendar,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardAnalyticsProps {
  statements: DailyStatement[];
}

const COLORS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b', // Slate
];

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ statements }) => {
  const [rangeFilter, setRangeFilter] = useState<'7D' | '30D' | 'CUSTOM' | 'ALL'>('7D');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Min and max available statement dates for bounds & convenience
  const { minDate, maxDate } = useMemo(() => {
    if (statements.length === 0) return { minDate: '', maxDate: '' };
    let min = statements[0].business_date;
    let max = statements[0].business_date;
    for (const s of statements) {
      if (s.business_date < min) min = s.business_date;
      if (s.business_date > max) max = s.business_date;
    }
    return { minDate: min, maxDate: max };
  }, [statements]);

  // Filter statements based on selected range
  const filteredStatements = useMemo(() => {
    if (statements.length === 0) return [];
    const sorted = [...statements].sort((a, b) => a.business_date.localeCompare(b.business_date));

    if (rangeFilter === 'ALL') return sorted;

    if (rangeFilter === 'CUSTOM') {
      return sorted.filter(s => {
        if (customStartDate && s.business_date < customStartDate) return false;
        if (customEndDate && s.business_date > customEndDate) return false;
        return true;
      });
    }

    const days = rangeFilter === '7D' ? 7 : 30;
    // Using reference against latest available date in sorted list
    const latestDateStr = sorted[sorted.length - 1]?.business_date;
    if (!latestDateStr) return sorted;

    const [year, month, day] = latestDateStr.split('-').map(Number);
    const refUtc = Date.UTC(year, month - 1, day);
    const cutoffUtc = refUtc - (days - 1) * 86400000;
    const cutoffStr = new Date(cutoffUtc).toISOString().split('T')[0];

    const res = sorted.filter(s => s.business_date >= cutoffStr);
    return res.length > 0 ? res : sorted.slice(-days);
  }, [statements, rangeFilter, customStartDate, customEndDate]);

  // Aggregate Metrics
  const { totalSalesPaise, operatingDays, avgDailySalesPaise, expenseRatio } =
    useMemo(() => {
      const totalSales = filteredStatements.reduce((sum, s) => sum + s.total_sales_paise, 0);
      const totalExpenses = filteredStatements.reduce((sum, s) => sum + s.total_expenses_paise, 0);
      const days = filteredStatements.length || 1;
      const avg = Math.round(totalSales / days);
      const ratio = totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : '0.0';

      return {
        totalSalesPaise: totalSales,
        operatingDays: filteredStatements.length,
        avgDailySalesPaise: avg,
        expenseRatio: ratio,
      };
    }, [filteredStatements]);

  // Prepare Daily Trend Data for Recharts
  const trendData = useMemo(() => {
    return filteredStatements.map(s => ({
      date: s.business_date.slice(5), // MM-DD
      sales: paiseToRupees(s.total_sales_paise),
      expenses: paiseToRupees(s.total_expenses_paise),
      net: paiseToRupees(s.net_difference_paise),
    }));
  }, [filteredStatements]);

  // Prepare Expense by Category Breakdown
  const expenseCategoryData = useMemo(() => {
    const map = new Map<string, number>();

    filteredStatements.forEach(s => {
      (s.expense_entries || []).forEach(e => {
        const cat = e.category_name || 'Miscellaneous';
        map.set(cat, (map.get(cat) || 0) + e.amount_paise);
      });
    });

    const entries = Array.from(map.entries()).map(([name, amountPaise]) => ({
      name,
      value: paiseToRupees(amountPaise),
    }));

    return entries.sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filteredStatements]);

  // Prepare Channel Breakdown
  const channelData = useMemo(() => {
    let cash = 0,
      upi = 0,
      card = 0,
      delivery = 0,
      other = 0;

    filteredStatements.forEach(s => {
      cash += s.cash_sales_paise;
      upi += s.upi_sales_paise;
      card += s.card_sales_paise;
      delivery += s.delivery_sales_paise;
      other += s.other_sales_paise;
    });

    return [
      { name: 'Cash', value: paiseToRupees(cash) },
      { name: 'UPI', value: paiseToRupees(upi) },
      { name: 'Card', value: paiseToRupees(card) },
      { name: 'Delivery', value: paiseToRupees(delivery) },
      { name: 'Other', value: paiseToRupees(other) },
    ].filter(c => c.value > 0);
  }, [filteredStatements]);

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Header & Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 sm:p-6 mb-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight m-0">
            Sales Analytics
          </h1>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-1.5" />
              {(['7D', '30D', 'CUSTOM', 'ALL'] as const).map(range => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setRangeFilter(range)}
                  className={`px-3 py-1 rounded text-2xs font-bold transition-all ${
                    rangeFilter === range
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {range === '7D'
                    ? '7 Days'
                    : range === '30D'
                    ? '30 Days'
                    : range === 'CUSTOM'
                    ? 'Custom Range'
                    : 'All Time'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {rangeFilter === 'CUSTOM' && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="analytics-start-date"
                className="text-2xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                From
              </label>
              <input
                id="analytics-start-date"
                type="date"
                value={customStartDate}
                min={minDate}
                max={customEndDate || maxDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="analytics-end-date"
                className="text-2xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                To
              </label>
              <input
                id="analytics-end-date"
                type="date"
                value={customEndDate}
                min={customStartDate || minDate}
                max={maxDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Clear date filter"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}

            <span className="text-2xs text-slate-500 dark:text-slate-400 ml-auto font-medium">
              Showing {filteredStatements.length} statement{filteredStatements.length === 1 ? '' : 's'}
            </span>
          </div>
        )}

        {/* 3 Agreed Core Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {/* Metric 1: Total Sales */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Total Sales ({operatingDays} Days)
              </span>
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-2">
              {formatPaiseToINR(totalSalesPaise)}
            </span>
            <span className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 block">
              Gross revenue across {operatingDays} days
            </span>
          </div>

          {/* Metric 2: Average Daily Sales */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Average Daily Sales
              </span>
              <div className="p-1.5 bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-2">
              {formatPaiseToINR(avgDailySalesPaise)}
            </span>
            <span className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 block">
              Daily average volume
            </span>
          </div>

          {/* Metric 3: Expense Ratio */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Expense Ratio
              </span>
              <div className="p-1.5 bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 rounded-lg">
                <PieIcon className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black text-rose-700 dark:text-rose-400 block mt-2">{expenseRatio}%</span>
            <span className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 block">
              Expenses relative to sales
            </span>
          </div>
        </div>
      </div>

      {statements.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors duration-200">
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Save daily statements to view trends and charts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales & Expense Trend Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 m-0">
              Daily Sales & Expenses
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(val: unknown) => [
                      val != null ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0',
                      '',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Expense Categories Donut Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 m-0">
              Top Expenses by Category
            </h2>
            <div className="h-64 w-full">
              {expenseCategoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No categorized expenses in selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseCategoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(val: unknown) => [
                        val != null ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0',
                        '',
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sales Channels Distribution */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-2 transition-colors duration-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 m-0">
              Sales Channels
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {channelData.map((c, i) => {
                const pct =
                  totalSalesPaise > 0
                    ? ((c.value / (totalSalesPaise / 100)) * 100).toFixed(1)
                    : '0';
                return (
                  <div key={c.name} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.name}</span>
                    </div>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100 block mt-1.5">
                      ₹{c.value.toLocaleString('en-IN')}
                    </span>
                    <span className="text-2xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                      {pct}% of sales
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
