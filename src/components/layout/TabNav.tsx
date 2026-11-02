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
      <nav className="pointer-events-auto bg-amber-600/95 dark:bg-amber-700/95 backdrop-blur-md border border-amber-500/80 dark:border-amber-600/80 shadow-xl shadow-amber-950/20 dark:shadow-black/50 rounded-2xl p-2 sm:p-2.5 max-w-lg w-full transition-all">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col sm:flex-row items-center justify-center py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-amber-100/90 hover:text-white hover:bg-white/15'
                }`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 sm:mr-1.5 transition-colors ${
                    isActive ? 'text-slate-900' : 'text-amber-200 hover:text-white'
                  }`}
                />
                <span className="text-2xs sm:text-xs mt-1 sm:mt-0 leading-tight truncate">
                  {tab.label}
                </span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-3xs uppercase font-extrabold hidden sm:inline-block ${
                      isActive
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-black/25 text-amber-100'
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
