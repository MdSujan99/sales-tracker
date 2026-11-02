import React from 'react';
import type { SalesBreakdown } from '../../types/statement';
import { paiseToRupees, rupeesToPaise, formatPaiseToINR, calculateTotalSales } from '../../lib/calculations';
import { Banknote, QrCode, CreditCard, Bike, PlusCircle, AlertCircle } from 'lucide-react';

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
  const totalSalesPaise = calculateTotalSales(sales);

  const handleChannelChange = (key: keyof SalesBreakdown, valueStr: string) => {
    const paise = rupeesToPaise(valueStr);
    onChange({
      ...sales,
      [key]: paise,
    });
  };

  const channels = [
    {
      key: 'cash_sales_paise' as keyof SalesBreakdown,
      label: 'Cash Sales',
      icon: Banknote,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      placeholder: '0.00',
    },
    {
      key: 'upi_sales_paise' as keyof SalesBreakdown,
      label: 'UPI / QR Payments',
      icon: QrCode,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      placeholder: '0.00',
    },
    {
      key: 'card_sales_paise' as keyof SalesBreakdown,
      label: 'Card / POS',
      icon: CreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      placeholder: '0.00',
    },
    {
      key: 'delivery_sales_paise' as keyof SalesBreakdown,
      label: 'Online Delivery (Zomato / Swiggy)',
      icon: Bike,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      placeholder: '0.00',
    },
    {
      key: 'other_sales_paise' as keyof SalesBreakdown,
      label: 'Other / Credit Sales',
      icon: PlusCircle,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      placeholder: '0.00',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">1. Sales Breakdown</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Enter sales for each confirmed channel
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium block">Total Sales</span>
          <span className="text-lg font-black text-emerald-700 tracking-tight">
            {formatPaiseToINR(totalSalesPaise)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {channels.map(channel => {
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
                <label className="text-xs font-semibold text-slate-700">
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
                  onChange={e => handleChannelChange(channel.key, e.target.value)}
                  placeholder={channel.placeholder}
                  className="w-full pl-8 pr-3 py-2 bg-white rounded-md border border-slate-300 text-slate-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Paper Written Total for verification */}
      <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500">
              Optional Paper Written Sales Total:
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
