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
      label: 'Print Snapshot',
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
    <nav className="bg-white border-b border-slate-200 no-print sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 sm:space-x-8 overflow-x-auto py-2 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                {tab.label}
                {tab.badge && (
                  <span className="ml-2 px-1.5 py-0.5 text-2xs font-bold rounded-full bg-amber-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
