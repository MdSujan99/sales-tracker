import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Wifi, WifiOff, Database, ShieldCheck, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, restaurant, isOnline, isSupabaseConnected, switchRole } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Restaurant Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none m-0">
                {restaurant.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-none">
                Daily Sales & Cash Statement
              </p>
            </div>
          </div>

          {/* Device & Sync Badges + Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Sync & Connectivity Badges */}
            <div className="hidden sm:flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
                title={isOnline ? 'Internet connected' : 'Working offline'}
              >
                {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {isOnline ? 'Online' : 'Offline'}
              </span>

              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isSupabaseConnected
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
                title={isSupabaseConnected ? 'Live Supabase Cloud Sync' : 'Local Browser Mode'}
              >
                <Database className="w-3 h-3 mr-1" />
                {isSupabaseConnected ? 'Cloud Synced' : 'Local Storage'}
              </span>
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => switchRole('ACCOUNTANT')}
                className={`flex items-center px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  user.role === 'ACCOUNTANT'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Accountant
              </button>
              <button
                type="button"
                onClick={() => switchRole('OWNER')}
                className={`flex items-center px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  user.role === 'OWNER'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
