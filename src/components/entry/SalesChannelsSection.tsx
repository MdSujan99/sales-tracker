import React from 'react';
import type { SalesBreakdown } from '../../types/statement';
import {
  paiseToRupees,
  rupeesToPaise,
  formatPaiseToINR,
  calculateTotalSales,
  calculateCashSales,
} from '../../lib/calculations';
import { Bike, CreditCard, QrCode, PlusCircle, Banknote, AlertCircle } from 'lucide-react';

interface SalesChannelsSectionProps {
  sales: SalesBreakdown;
  onChange: (updated: SalesBreakdown) => void;
}

export const SalesChannelsSection: React.FC<SalesChannelsSectionProps> = ({
  sales,
  onChange,
}) => {
  const totalSalesPaise = sales.total_sales_paise ?? calculateTotalSales(sales);

  const derivedCashSalesPaise = calculateCashSales(totalSalesPaise, sales);
  const isNegativeCash = derivedCashSalesPaise < 0;

  const handleTotalSalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotalPaise = rupeesToPaise(e.target.value);
    const newCashPaise = calculateCashSales(newTotalPaise, sales);
    onChange({
      ...sales,
      total_sales_paise: newTotalPaise,
      cash_sales_paise: newCashPaise,
    });
  };

  const handleNonCashChange = (
    key: 'delivery_sales_paise' | 'card_sales_paise' | 'upi_sales_paise' | 'other_sales_paise',
    valueStr: string
  ) => {
    const valPaise = rupeesToPaise(valueStr);
    const updated = {
      ...sales,
      [key]: valPaise,
    };
    const currentTotal = updated.total_sales_paise ?? totalSalesPaise;
    const newCashPaise = calculateCashSales(currentTotal, updated);
    onChange({
      ...updated,
      total_sales_paise: currentTotal,
      cash_sales_paise: newCashPaise,
    });
  };

  const nonCashChannels = [
    {
      key: 'delivery_sales_paise' as const,
      label: 'Online Delivery',
      icon: Bike,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60',
      placeholder: '0.00',
    },
    {
      key: 'card_sales_paise' as const,
      label: 'Card',
      icon: CreditCard,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/60',
      placeholder: '0.00',
    },
    {
      key: 'upi_sales_paise' as const,
      label: 'UPI',
      icon: QrCode,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/60',
      placeholder: '0.00',
    },
    {
      key: 'other_sales_paise' as const,
      label: 'Other',
      icon: PlusCircle,
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      placeholder: '0.00',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 sm:p-6 mb-6 transition-colors duration-200">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">1. Sales Breakdown</h2>
        <div className="text-right">
          <span className="text-2xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider block">Total Sales</span>
          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-500 tracking-tight">
            {formatPaiseToINR(totalSalesPaise)}
          </span>
        </div>
      </div>

      {/* Primary Total Sales Input */}
      <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <label className="text-sm font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
            Total Daily Sales
          </label>

          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-amber-700 dark:text-amber-400 text-lg font-bold pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={totalSalesPaise ? paiseToRupees(totalSalesPaise) : ''}
              onChange={handleTotalSalesChange}
              placeholder="0.00"
              className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Non-Cash Sales Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {nonCashChannels.map(channel => {
          const Icon = channel.icon;
          const currentRupees = sales[channel.key] ? paiseToRupees(sales[channel.key]) : '';

          return (
            <div
              key={channel.key}
              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 transition-colors"
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <div className={`p-1.5 rounded-md ${channel.bgColor} ${channel.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {channel.label}
                </label>
              </div>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 text-sm font-semibold pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={currentRupees}
                  onChange={e => handleNonCashChange(channel.key, e.target.value)}
                  placeholder={channel.placeholder}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Derived Cash Sales Display Card */}
      <div
        className={`p-3.5 rounded-xl border transition-all ${
          isNegativeCash
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
            : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-lg ${
                isNegativeCash
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold block">
                Cash Sales
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Derived (Total − Non-Cash)
              </span>
            </div>
          </div>

          <span
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isNegativeCash ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {formatPaiseToINR(derivedCashSalesPaise)}
          </span>
        </div>

        {isNegativeCash && (
          <div className="mt-2.5 pt-2 border-t border-rose-200 dark:border-rose-800/80 flex items-center space-x-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Non-cash exceeds total sales by {formatPaiseToINR(Math.abs(derivedCashSalesPaise))}. Please review figures.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
