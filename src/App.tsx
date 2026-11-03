import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { TabNav, type AppTab } from './components/layout/TabNav';
import { DailyEntryForm } from './components/entry/DailyEntryForm';
import { DailySnapshotReport } from './components/snapshot/DailySnapshotReport';
import { StatementHistory } from './components/history/StatementHistory';
import { DashboardAnalytics } from './components/dashboard/DashboardAnalytics';
import { getStatements, getExpenseCategories, deleteStatementFromDb, generateUuid } from './lib/supabase';
import type { DailyStatement, ExpenseCategory } from './types/statement';
import { FileText, PlusCircle } from 'lucide-react';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('ENTRY');
  const [statements, setStatements] = useState<DailyStatement[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [activeStatement, setActiveStatement] = useState<DailyStatement | null>(null);
  const [snapshotStatement, setSnapshotStatement] = useState<DailyStatement | null>(null);

  // Load statements & categories on mount
  useEffect(() => {
    // Purge any legacy sample/mock data from localStorage
    try {
      const local = localStorage.getItem('restaurant_daily_statements_v1');
      if (local) {
        const parsed = JSON.parse(local);
        const filtered = parsed.filter((s: { id?: string }) => s.id !== 'stmt-sample-yesterday');
        if (filtered.length !== parsed.length) {
          localStorage.setItem('restaurant_daily_statements_v1', JSON.stringify(filtered));
        }
      }
      const draft = localStorage.getItem('restaurant_daily_statement_active_draft');
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        if (parsedDraft.id === 'stmt-sample-yesterday') {
          localStorage.removeItem('restaurant_daily_statement_active_draft');
        }
      }
    } catch {
      // Ignore
    }

    async function loadData() {
      const cats = await getExpenseCategories();
      setCategories(cats);

      const stmts = await getStatements();
      // Filter out any sample data if previously persisted
      const cleanStmts = stmts.filter(s => s.id !== 'stmt-sample-yesterday');
      setStatements(cleanStmts);

      // Auto-load today's statement if it already exists
      const today = new Date().toISOString().split('T')[0];
      const todayStmt = cleanStmts.find(s => s.business_date === today);
      if (todayStmt) {
        setActiveStatement(todayStmt);
      }
    }
    loadData();
  }, []);

  const handleStatementSaved = (saved: DailyStatement) => {
    setStatements(prev => {
      const idx = prev.findIndex(s => s.id === saved.id || s.business_date === saved.business_date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });

    if (saved.status === 'FINALIZED') {
      // Create a fresh blank statement for the entry form so it resets
      const today = new Date().toISOString().split('T')[0];
      const todayExists = (saved.business_date === today) || statements.some(s => s.business_date === today);
      let targetDate = today;
      if (todayExists) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        targetDate = d.toISOString().split('T')[0];
      }

      const blank: DailyStatement = {
        id: generateUuid(),
        restaurant_id: '00000000-0000-0000-0000-000000000001',
        business_date: targetDate,
        statement_number: `ST-${targetDate.slice(2).replace(/-/g, '')}-01`,
        status: 'DRAFT',
        cash_sales_paise: 0,
        upi_sales_paise: 0,
        card_sales_paise: 0,
        delivery_sales_paise: 0,
        other_sales_paise: 0,
        total_sales_paise: 0,
        cash_memos: [
          { id: generateUuid(), from_number: '', to_number: '', source: 'Counter / Dine-in', amount_paise: 0 },
        ],
        total_cash_memos_paise: 0,
        expense_entries: [],
        total_expenses_paise: 0,
        net_difference_paise: 0,
        cash_in_hand_paise: 0,
        closing_cash_paise: 0,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setActiveStatement(blank);
    } else {
      setActiveStatement(saved);
    }
  };

  const handleOpenStatement = (stmt: DailyStatement) => {
    setActiveStatement(stmt);
    setActiveTab('ENTRY');
  };

  const handleViewSnapshot = (stmt: DailyStatement) => {
    setSnapshotStatement(stmt);
    setActiveTab('SNAPSHOT');
  };

  const handleDuplicateStatement = (sourceStmt: DailyStatement) => {
    const today = new Date().toISOString().split('T')[0];
    const duplicated: DailyStatement = {
      ...sourceStmt,
      id: generateUuid(),
      business_date: today,
      statement_number: `ST-${today.slice(2).replace(/-/g, '')}-01`,
      status: 'DRAFT',
      // Reset sales & amounts for the new day, keep expense categories
      cash_sales_paise: 0,
      upi_sales_paise: 0,
      card_sales_paise: 0,
      delivery_sales_paise: 0,
      other_sales_paise: 0,
      total_sales_paise: 0,
      cash_memos: [
        { id: generateUuid(), from_number: '', to_number: '', source: 'Counter', amount_paise: 0 },
      ],
      total_cash_memos_paise: 0,
      expense_entries: (sourceStmt.expense_entries || []).map(e => ({
        ...e,
        id: generateUuid(),
        amount_paise: 0, // Cleared amount ready for today's entry
      })),
      total_expenses_paise: 0,
      net_difference_paise: 0,
      notes: `Duplicated category structure from ${sourceStmt.business_date}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setActiveStatement(duplicated);
    setActiveTab('ENTRY');
  };

  const handleDeleteStatement = async (id: string) => {
    await deleteStatementFromDb(id);
    setStatements(prev => prev.filter(s => s.id !== id));
    if (activeStatement?.id === id) setActiveStatement(null);
    if (snapshotStatement?.id === id) setSnapshotStatement(null);
  };

  const handleAddCategory = (newCat: ExpenseCategory) => {
    setCategories(prev => {
      if (prev.some(c => c.id === newCat.id)) return prev;
      return [newCat, ...prev];
    });
  };

  const handleRemoveCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleCreateNewStatement = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayExists = statements.some(s => s.business_date === today);
    let targetDate = today;
    if (todayExists) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      targetDate = d.toISOString().split('T')[0];
    }

    const blank: DailyStatement = {
      id: generateUuid(),
      restaurant_id: '00000000-0000-0000-0000-000000000001',
      business_date: targetDate,
      statement_number: `ST-${targetDate.slice(2).replace(/-/g, '')}-01`,
      status: 'DRAFT',
      cash_sales_paise: 0,
      upi_sales_paise: 0,
      card_sales_paise: 0,
      delivery_sales_paise: 0,
      other_sales_paise: 0,
      total_sales_paise: 0,
      cash_memos: [
        { id: generateUuid(), from_number: '', to_number: '', source: 'Counter / Dine-in', amount_paise: 0 },
      ],
      total_cash_memos_paise: 0,
      expense_entries: [],
      total_expenses_paise: 0,
      net_difference_paise: 0,
      cash_in_hand_paise: 0,
      closing_cash_paise: 0,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setActiveStatement(blank);
    setActiveTab('ENTRY');
  };

  const statementToSnapshot = snapshotStatement || activeStatement || statements[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      <Navbar />
      <TabNav
        activeTab={activeTab}
        onTabChange={tab => {
          if (tab === 'SNAPSHOT' && !snapshotStatement && statements.length > 0) {
            setSnapshotStatement(activeStatement || statements[0]);
          }
          if (tab === 'ENTRY' && !activeStatement) {
            const today = new Date().toISOString().split('T')[0];
            const todayStmt = statements.find(s => s.business_date === today);
            if (todayStmt) {
              setActiveStatement(todayStmt);
            }
          }
          setActiveTab(tab);
        }}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {activeTab === 'ENTRY' && (
          <DailyEntryForm
            initialStatement={activeStatement}
            existingStatements={statements}
            categories={categories}
            onAddCategory={handleAddCategory}
            onRemoveCategory={handleRemoveCategory}
            onStatementSaved={handleStatementSaved}
            onViewSnapshot={handleViewSnapshot}
            onOpenStatement={handleOpenStatement}
            onCreateNewStatement={handleCreateNewStatement}
          />
        )}

        {activeTab === 'SNAPSHOT' && (
          statementToSnapshot ? (
            <DailySnapshotReport
              statement={statementToSnapshot}
              onEdit={() => {
                setActiveStatement(statementToSnapshot);
                setActiveTab('ENTRY');
              }}
              onBack={() => setActiveTab('ENTRY')}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 m-0">No Statement Available</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
                Complete and save your first daily cash statement in the Daily Entry tab to view and print your A4 snapshot.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('ENTRY')}
                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Go to Daily Entry
              </button>
            </div>
          )
        )}

        {activeTab === 'HISTORY' && (
          <StatementHistory
            statements={statements}
            onOpenStatement={handleOpenStatement}
            onViewSnapshot={handleViewSnapshot}
            onDuplicateStatement={handleDuplicateStatement}
            onDeleteStatement={handleDeleteStatement}
          />
        )}

        {activeTab === 'DASHBOARD' && (
          <DashboardAnalytics statements={statements} />
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
