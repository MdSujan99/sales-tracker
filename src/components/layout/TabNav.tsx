import React from 'react';
import { FileEdit, FileText, History, BarChart3 } from 'lucide-react';

export type AppTab = 'ENTRY' | 'SNAPSHOT' | 'HISTORY' | 'DASHBOARD';

interface TabNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  hasUnsavedChanges?: boolean;
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onTabChange,
  hasUnsavedChanges = false,
}) => {
  const tabs = [
    {
      id: 'ENTRY' as AppTab,
      label: 'Daily Entry',
      icon: FileEdit,
      badge: hasUnsavedChanges ? 'Draft' : undefined,
    },
    {
      id: 'SNAPSHOT' as AppTab,
      label: 'Snapshot',
      icon: FileText,
    },
    {
      id: 'HISTORY' as AppTab,
      label: 'History',
      icon: History,
    },
    {
      id: 'DASHBOARD' as AppTab,
      label: 'Dashboard',
      icon: BarChart3,
    },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-30 flex justify-center px-4 pointer-events-none no-print">
      <nav className="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-900/10 rounded-2xl p-1.5 max-w-lg w-full transition-all">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col sm:flex-row items-center justify-center py-2 px-1 sm:px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 sm:mr-1.5 transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-2xs sm:text-xs mt-0.5 sm:mt-0 leading-tight truncate">
                  {tab.label}
                </span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-3xs uppercase font-extrabold hidden sm:inline-block ${
                      isActive ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
