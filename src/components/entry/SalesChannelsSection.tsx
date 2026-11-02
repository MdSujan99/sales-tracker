import React from 'react';
import type { SalesBreakdown } from '../../types/statement';
import {
  paiseToRupees,
  rupeesToPaise,
  formatPaiseToINR,
  calculateTotalSales,
  calculateCashSales,
} from '../../lib/calculations';
import { Bike, CreditCard, QrCode, PlusCircle, Banknote, AlertCircle, ArrowDown } from 'lucide-react';

interface SalesChannelsSectionProps {
  sales: SalesBreakdown;
  onChange: (updated: SalesBreakdown) => void;
  enteredAccountSalesPaise?: number;
  onEnteredAccountSalesChange?: (val: number | undefined) => void;
}

export const SalesChannelsSection: React.FC<SalesChannelsSectionProps> = ({
  sales,
  onChange,
  enteredAccountSalesPaise,
  onEnteredAccountSalesChange,
}) => {
  const totalSalesPaise = sales.total_sales_paise ?? calculateTotalSales(sales);
  const nonCashChannelsTotal =
    (sales.delivery_sales_paise || 0) +
    (sales.card_sales_paise || 0) +
    (sales.upi_sales_paise || 0) +
    (sales.other_sales_paise || 0);

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
      label: '1. Online Delivery (Zomato / Swiggy)',
      icon: Bike,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      placeholder: '0.00',
    },
    {
      key: 'card_sales_paise' as const,
      label: '2. Card / POS Settlements',
      icon: CreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      placeholder: '0.00',
    },
    {
      key: 'upi_sales_paise' as const,
      label: '3. UPI / QR Payments (GPay/PhonePe)',
      icon: QrCode,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      placeholder: '0.00',
    },
    {
      key: 'other_sales_paise' as const,
      label: '4. Other / Credit Sales',
      icon: PlusCircle,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      placeholder: '0.00',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">1. Sales Breakdown</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Enter Total Sales, then online delivery, card, and UPI. Cash sales is automatically derived.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium block">Total Sales</span>
          <span className="text-lg font-black text-amber-600 tracking-tight">
            {formatPaiseToINR(totalSalesPaise)}
          </span>
        </div>
      </div>

      {/* Step 1: Primary Total Sales Input */}
      <div className="bg-gradient-to-r from-amber-50/90 to-amber-100/60 border-2 border-amber-300 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-black">
                1
              </span>
              <label className="text-sm font-black text-amber-950 uppercase tracking-wide">
                Total Daily Sales (Register / POS Grand Total)
              </label>
            </div>
            <p className="text-xs text-amber-800 mt-1 sm:ml-7">
              Enter total daily revenue before non-cash deductions
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-amber-700 text-lg font-black pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={totalSalesPaise ? paiseToRupees(totalSalesPaise) : ''}
              onChange={handleTotalSalesChange}
              placeholder="0.00"
              className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-lg border-2 border-amber-400 text-slate-900 font-black text-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-300 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Arrow Down Divider indicating deduction */}
      <div className="flex items-center justify-center my-3 text-slate-400">
        <div className="h-px bg-slate-200 flex-1"></div>
        <div className="mx-3 flex items-center space-x-1 text-2xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <ArrowDown className="w-3 h-3 text-slate-400 mr-1" />
          Deduct Non-Cash Payment Channels
        </div>
        <div className="h-px bg-slate-200 flex-1"></div>
      </div>

      {/* Step 2: Non-Cash Sales Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
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
                  className="w-full pl-8 pr-3 py-2 bg-white rounded-md border border-slate-300 text-slate-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 3: Derived Cash Sales Display Card */}
      <div
        className={`p-4 rounded-xl border-2 transition-all ${
          isNegativeCash
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-lg ${
                isNegativeCash ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black uppercase tracking-wide">
                  Derived Cash Sales
                </span>
                <span
                  className={`text-2xs font-bold px-2 py-0.5 rounded-full uppercase border ${
                    isNegativeCash
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  Auto-Calculated
                </span>
              </div>
              <p className="text-xs opacity-80 mt-0.5 m-0 font-medium">
                Formula: Total Sales ({formatPaiseToINR(totalSalesPaise)}) − Non-Cash Channels ({formatPaiseToINR(nonCashChannelsTotal)})
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xs uppercase tracking-wider block opacity-75 font-semibold">
              Cash Sales Result
            </span>
            <span
              className={`text-2xl font-black tracking-tight ${
                isNegativeCash ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {formatPaiseToINR(derivedCashSalesPaise)}
            </span>
          </div>
        </div>

        {isNegativeCash && (
          <div className="mt-3 pt-3 border-t border-rose-200 flex items-center space-x-2 text-xs font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Warning: Non-cash payments exceed Total Sales by {formatPaiseToINR(Math.abs(derivedCashSalesPaise))}. Please review your entered figures.
            </span>
          </div>
        )}
      </div>

      {/* Optional Paper Written Total for secondary verification if needed */}
      <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500">
              Optional Secondary Check (Paper Written Total):
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative w-36">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-semibold pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={
                  enteredAccountSalesPaise !== undefined && enteredAccountSalesPaise > 0
                    ? paiseToRupees(enteredAccountSalesPaise)
                    : ''
                }
                onChange={e => {
                  const val = e.target.value ? rupeesToPaise(e.target.value) : undefined;
                  onEnteredAccountSalesChange?.(val);
                }}
                placeholder="From paper"
                className="w-full pl-6 pr-2 py-1 text-xs bg-slate-50 rounded border border-slate-200 text-slate-700 font-medium focus:outline-none focus:bg-white"
              />
            </div>
            {enteredAccountSalesPaise !== undefined &&
              enteredAccountSalesPaise > 0 &&
              enteredAccountSalesPaise !== totalSalesPaise && (
                <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Diff: {formatPaiseToINR(Math.abs(enteredAccountSalesPaise - totalSalesPaise))}
                </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
