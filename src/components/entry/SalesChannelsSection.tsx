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
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      placeholder: '0.00',
    },
    {
      key: 'card_sales_paise' as const,
      label: 'Card',
      icon: CreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      placeholder: '0.00',
    },
    {
      key: 'upi_sales_paise' as const,
      label: 'UPI',
      icon: QrCode,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      placeholder: '0.00',
    },
    {
      key: 'other_sales_paise' as const,
      label: 'Other',
      icon: PlusCircle,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      placeholder: '0.00',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <h2 className="text-base font-bold text-slate-900 m-0">1. Sales Breakdown</h2>
        <div className="text-right">
          <span className="text-2xs text-slate-400 font-medium uppercase tracking-wider block">Total Sales</span>
          <span className="text-base sm:text-lg font-black text-amber-600 tracking-tight">
            {formatPaiseToINR(totalSalesPaise)}
          </span>
        </div>
      </div>

      {/* Primary Total Sales Input */}
      <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <label className="text-sm font-bold text-amber-950 uppercase tracking-wide">
            Total Daily Sales
          </label>

          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-amber-700 text-lg font-bold pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={totalSalesPaise ? paiseToRupees(totalSalesPaise) : ''}
              onChange={handleTotalSalesChange}
              placeholder="0.00"
              className="w-full pl-9 pr-3.5 py-2 bg-white rounded-lg border border-amber-300 text-slate-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-300 shadow-xs"
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
              className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-lg border border-slate-200/80 transition-colors"
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <div className={`p-1.5 rounded-md ${channel.bgColor} ${channel.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <label className="text-xs font-semibold text-slate-700 truncate">
                  {channel.label}
                </label>
              </div>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-semibold pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={currentRupees}
                  onChange={e => handleNonCashChange(channel.key, e.target.value)}
                  placeholder={channel.placeholder}
                  className="w-full pl-8 pr-3 py-1.5 bg-white rounded-md border border-slate-300 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-300"
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
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-lg ${
                isNegativeCash ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold block">
                Cash Sales
              </span>
              <span className="text-xs text-slate-500 block">
                Derived (Total − Non-Cash)
              </span>
            </div>
          </div>

          <span
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isNegativeCash ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {formatPaiseToINR(derivedCashSalesPaise)}
          </span>
        </div>

        {isNegativeCash && (
          <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center space-x-1.5 text-xs font-semibold text-rose-700">
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
