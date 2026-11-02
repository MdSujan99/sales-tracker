# Restaurant Daily Sales Snapshot Web App

## Final Project Plan (Single App Architecture)

**Status:** Approved\
**Version:** 2.0 (Single React/Vite + Supabase Stack)\
**Date:** 2 November 2026

------------------------------------------------------------------------

## 1. Project objective

Build a clean, mobile-first single web application that replaces the restaurant
accountant's handwritten **Daily Cash Statement**.

The accountant can enter daily sales, cash memo details, and expenses from a
phone or laptop. The application calculates totals in real time, flags
reconciliation inconsistencies, centrally saves statements, generates a printable
daily A4 snapshot/PDF, and provides basic sales analytics for the owner.

### Goals

- Replace the handwritten daily statement with a fast, touch-friendly digital workflow.
- Eliminate backend server maintenance and cold starts by utilizing a single React/Vite app with Supabase.
- Allow the accountant (phone) and owner (laptop) to access and synchronize records in real time.
- Generate clean printable statements and browser-native PDFs.
- Track daily, weekly, monthly, and yearly sales trends.
- Keep operational costs zero on standard free tiers (Vercel/Cloudflare Pages + Supabase).
- Prevent scope creep: avoid expanding into inventory, POS, or full accounting in version one.

---

## 2. Technology stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18/19 + TypeScript + Vite | Responsive, fast, type-safe single-page application |
| **UI Styling** | Tailwind CSS | Consistent, mobile-first interface with large touch targets |
| **Icons** | Lucide React | Clean, lightweight iconography |
| **Persistence & Auth** | Supabase (PostgreSQL + Auth + RLS) | Managed database, user authentication (Owner & Accountant), and Row-Level Security without a custom backend server |
| **Data Fetching & State** | Supabase JS Client (`@supabase/supabase-js`) | Direct, secure database querying and real-time syncing |
| **Charts** | Recharts | Sales trends and expense category visual breakdowns |
| **Report Output** | HTML print stylesheet (`@media print`) | Native browser "Save as PDF" and A4 printable statements |
| **Frontend Hosting** | Vercel / Cloudflare Pages / Netlify | Global CDN, instant loading, automated CI/CD from Git |
| **Source Control** | GitHub | Version control and automated deployments |

### Why this replaced the Java/Spring Boot stack

1. **Zero Cold Starts**: The previous plan used a Render free web service for Spring Boot, which sleeps after 15 minutes and takes 30–60+ seconds to spin up. A static React/Vite app delivered via CDN loads in under a second.
2. **Single Codebase**: All data models, validation logic, calculations, and UI live in a single TypeScript project. No DTO duplication or cross-language sync.
3. **No Backend Deployment Overhead**: Supabase provides PostgreSQL, authentication, and auto-generated secure APIs via Row-Level Security (RLS) out of the box.

---

## 3. Architecture

```text
Accountant's Phone (PWA / Mobile Web)       Owner's Laptop (Desktop Web)
                 \                                     /
                  \                                   /
                   +----------------+----------------+
                                    |
                            HTTPS / Global CDN
                                    |
                    +-------------------------------+
                    |     React + TypeScript App    |
                    |            (Vite)             |
                    |                               |
                    |  - Live Validation & Rec.    |
                    |  - Responsive Data Entry UI   |
                    |  - Print / PDF Snapshot       |
                    |  - Analytics & Charts         |
                    +---------------+---------------+
                                    |
                       Supabase Client SDK (HTTPS)
                                    |
                    +---------------+---------------+
                    |           Supabase            |
                    |                               |
                    |  - Auth (Owner / Accountant)  |
                    |  - Row Level Security (RLS)   |
                    |  - Managed PostgreSQL         |
                    +-------------------------------+
```

### Architecture principles

- **Client-authoritative calculations**: The frontend calculation module uses pure, deterministic TypeScript functions operating with integer paise (1 INR = 100 paise) to prevent floating-point discrepancies.
- **Security through Row Level Security (RLS)**: Only authenticated users (Owner and Accountant) with appropriate roles can read or write daily statements. No service-role or master keys are ever exposed in frontend client code.
- **Offline tolerance & draft safety**: In-progress entries auto-save to browser `localStorage` to prevent data loss if connectivity drops, syncing to Supabase once confirmed.

---

## 4. Application screens

### 4.1 Daily Entry

The core data-entry screen, optimized for phone usage:

- **Header**: Business date picker (defaults to today) and statement number.
- **Sales Section**: Inputs for confirmed sales channels (e.g., Cash, UPI, Zomato, Swiggy, Card).
- **Cash Memo Section**: Memo number ranges (`from_number`, `to_number`), source, and amount.
- **Expense Section**: Predefined categories matching the restaurant's paper form + custom line items with descriptions and notes.
- **Reconciliation & Summary Panel**:
  - Live calculated total sales.
  - Live calculated total expenses.
  - Calculated cash memo total.
  - Calculated net difference (`Account Sales - Account Expenses`).
  - Validation badges (matching/differing indicators).
- **Actions**:
  - **Save Draft**: Saves work-in-progress locally and to Supabase with status `DRAFT`.
  - **Finalize Statement**: Runs full validation checks and locks the statement with status `FINALIZED`.

### 4.2 Daily Snapshot (A4 Print / PDF)

Follows the section layout of the restaurant's physical statement:

1. Header with restaurant name, business date, statement number, and status.
2. Itemized sales channel breakdown with calculated total.
3. Cash memo range details and total.
4. Categorized expenses with itemized list and total.
5. Summary: Account Sales, Account Expenses, and Net Difference / Agreed Closing figure.
6. Accountant & Manager notes and sign-off placeholders.
7. Clean browser print styling: hides buttons/navigation, fits cleanly on a single A4 page portrait.

### 4.3 Statement History

- Date-range filter and search.
- List and card views displaying date, statement number, total sales, expenses, and status (`DRAFT` / `FINALIZED`).
- One-click actions to View, Edit, Print, or Duplicate previous day's expense structure.
- CSV / JSON export for backup.

### 4.4 Dashboard & Analytics

Key performance metrics:
1. **Sales Growth**: Comparison against the previous day/week/month.
2. **Average Daily Sales**: Operating day average over selected date range.
3. **Recorded Expense Ratio**: `(Total Expenses / Total Sales) * 100`.
4. **Visual Trends**:
   - Daily/weekly sales bar/line chart (Recharts).
   - Expense distribution pie/donut chart by category.

---

## 5. Database schema & security (Supabase PostgreSQL)

### 5.1 Tables

```sql
-- Restaurant profile
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Statements
CREATE TABLE daily_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    business_date DATE NOT NULL,
    statement_number TEXT,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'FINALIZED')),
    
    -- Monetary amounts stored in integer paise
    cash_sales_paise BIGINT DEFAULT 0,
    upi_sales_paise BIGINT DEFAULT 0,
    card_sales_paise BIGINT DEFAULT 0,
    delivery_sales_paise BIGINT DEFAULT 0,
    other_sales_paise BIGINT DEFAULT 0,
    total_sales_paise BIGINT NOT NULL DEFAULT 0,
    
    total_expenses_paise BIGINT NOT NULL DEFAULT 0,
    net_difference_paise BIGINT NOT NULL DEFAULT 0,
    
    closing_cash_paise BIGINT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(restaurant_id, business_date)
);

-- Cash Memos
CREATE TABLE cash_memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID REFERENCES daily_statements(id) ON DELETE CASCADE,
    from_number TEXT,
    to_number TEXT,
    source TEXT,
    amount_paise BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predefined & Custom Expense Categories
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itemized Expenses
CREATE TABLE expense_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID REFERENCES daily_statements(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL, -- Cached to preserve history if category is renamed
    description TEXT,
    amount_paise BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Row Level Security (RLS)

- Enable RLS on all tables:
  ```sql
  ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
  ALTER TABLE daily_statements ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cash_memos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;
  ```
- Allow authenticated users belonging to the restaurant to SELECT, INSERT, and UPDATE records.

---

## 6. Business calculations & integer paise rules

All monetary arithmetic is executed in **integer paise** (e.g. ₹150.50 = `15050` paise):

```typescript
// Core calculations
totalSales = cashSales + upiSales + cardSales + deliverySales + otherSales;
totalExpenses = sum(expenseEntries.map(e => e.amount));
totalCashMemos = sum(cashMemos.map(m => m.amount));
netDifference = totalSales - totalExpenses;
```

### Reconciliation rules

1. **Validation Warnings**:
   - Discrepancy between entered figures and computed channel sums flags a visual alert.
   - Non-blocking for Draft saves; highlighted confirmation required for Finalization.
2. **Memo Range Checks**:
   - Highlights skipped memo numbers or inverted ranges (`to_number < from_number`).

---

## 7. Implementation roadmap

### Phase 1: Foundation & Scaffold
- Initialize React + TypeScript + Vite project in the repository.
- Install and configure Tailwind CSS, Lucide React, and Recharts.
- Set up Supabase client utility and environment variable structure (`.env.example`).
- Create pure calculation utilities for integer paise conversion, totals, and reconciliation with unit tests.

### Phase 2: Daily Entry Form
- Build responsive, mobile-first Daily Entry UI (date selector, sales channels, cash memo rows, expense list).
- Implement real-time calculation and validation panel.
- Add local draft auto-saving via `localStorage` with restore prompt.

### Phase 3: Supabase Backend & Auth Integration
- Provide the complete SQL migration script (tables, RLS policies, default expense categories).
- Build lightweight Auth context & Login screen (Owner & Accountant).
- Implement statement draft saving, loading, and finalization against Supabase.

### Phase 4: Daily Snapshot & Print/PDF
- Create the A4 print layout matching the physical daily cash statement.
- Implement browser print trigger and PDF optimization styles.

### Phase 5: Statement History & Analytics Dashboard
- Build statement list with date search and filtering.
- Implement statement duplication (copy yesterday's expense categories).
- Build analytics dashboard: period comparison, average daily sales, expense ratio, and trend charts.

### Phase 6: Production Polish & Deployment
- Finalize responsive UX across mobile phone and desktop viewports.
- Configure PWA manifest (Add to Home Screen).
- Production build verification and deployment guide for Vercel / Cloudflare Pages.
