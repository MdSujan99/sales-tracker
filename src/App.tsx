import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { TabNav, type AppTab } from './components/layout/TabNav';
import { DailyEntryForm } from './components/entry/DailyEntryForm';
import { DailySnapshotReport } from './components/snapshot/DailySnapshotReport';
import { StatementHistory } from './components/history/StatementHistory';
import { DashboardAnalytics } from './components/dashboard/DashboardAnalytics';
import { getStatements, getExpenseCategories, deleteStatementFromDb, saveStatementToDb, generateUuid } from './lib/supabase';
import type { DailyStatement, ExpenseCategory } from './types/statement';

// Initial sample statement to seed if empty
const SAMPLE_INITIAL_STATEMENTS: DailyStatement[] = [
  {
    id: 'stmt-sample-yesterday',
    restaurant_id: '00000000-0000-0000-0000-000000000001',
    business_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    statement_number: `ST-${new Date(Date.now() - 86400000).toISOString().slice(2, 10).replace(/-/g, '')}-01`,
    status: 'FINALIZED',
    cash_sales_paise: 1850000,     // ₹18,500
    upi_sales_paise: 2420000,      // ₹24,200
    card_sales_paise: 650000,      // ₹6,500
    delivery_sales_paise: 890000,  // ₹8,900
    other_sales_paise: 0,
    total_sales_paise: 5810000,    // ₹58,100
    cash_memos: [
      { id: 'm-1', from_number: '101', to_number: '148', source: 'Dine-in Floor', amount_paise: 2240000 },
      { id: 'm-2', from_number: '501', to_number: '535', source: 'Takeaway Counter', amount_paise: 1120000 },
    ],
    total_cash_memos_paise: 3360000,
    expense_entries: [
      { id: 'e-1', category_name: 'Vegetables / Mandi', description: 'Early morning vegetable market', amount_paise: 420000 },
      { id: 'e-2', category_name: 'Dairy / Milk / Paneer', description: 'Amul Milk & Paneer crate', amount_paise: 280000 },
      { id: 'e-3', category_name: 'Gas / Commercial Cylinders', description: '19kg Commercial Bharat Gas', amount_paise: 185000 },
      { id: 'e-4', category_name: 'Daily Wages / Labour', description: 'Dishwasher & helper wage', amount_paise: 90000 },
      { id: 'e-5', category_name: 'Staff Tea & Refreshment', description: 'Staff evening snacks', amount_paise: 35000 },
    ],
    total_expenses_paise: 1010000, // ₹10,100
    net_difference_paise: 4800000, // ₹48,000
    notes: 'Dinner rush was heavy. All cash counts verified with manager.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('ENTRY');
  const [statements, setStatements] = useState<DailyStatement[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [activeStatement, setActiveStatement] = useState<DailyStatement | null>(null);
  const [snapshotStatement, setSnapshotStatement] = useState<DailyStatement | null>(null);

  // Load statements & categories on mount
  useEffect(() => {
    async function loadData() {
      const cats = await getExpenseCategories();
      setCategories(cats);

      let stmts = await getStatements();
      if (stmts.length === 0) {
        // Seed initial sample statement
        await saveStatementToDb(SAMPLE_INITIAL_STATEMENTS[0]);
        stmts = SAMPLE_INITIAL_STATEMENTS;
      }
      setStatements(stmts);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <TabNav
        activeTab={activeTab}
        onTabChange={tab => {
          if (tab === 'SNAPSHOT' && !snapshotStatement && statements.length > 0) {
            setSnapshotStatement(activeStatement || statements[0]);
          }
          setActiveTab(tab);
        }}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'ENTRY' && (
          <DailyEntryForm
            initialStatement={activeStatement}
            categories={categories}
            onStatementSaved={handleStatementSaved}
            onViewSnapshot={handleViewSnapshot}
          />
        )}

        {activeTab === 'SNAPSHOT' && (
          <DailySnapshotReport
            statement={snapshotStatement || activeStatement || statements[0] || SAMPLE_INITIAL_STATEMENTS[0]}
            onEdit={() => {
              if (snapshotStatement) setActiveStatement(snapshotStatement);
              setActiveTab('ENTRY');
            }}
            onBack={() => setActiveTab('ENTRY')}
          />
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
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
