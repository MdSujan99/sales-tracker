# Project Overview

The **Restaurant Daily Sales Snapshot Web App** is a clean, mobile-first single-page web application designed to replace the restaurant accountant's handwritten **Daily Cash Statement**.

It allows accountants to enter daily sales across multiple channels (Cash, UPI, Card, Delivery platforms like Zomato/Swiggy), record cash memo ranges, and log itemized operational expenses directly from a phone or laptop. The system computes totals in real time, flags reconciliation discrepancies against physical book entries, stores statements locally and in the cloud, prints physical A4 / PDF snapshots with signature blocks, and visualizes sales analytics for restaurant owners.

## Tech Stack & Architecture

- **Language / Runtime**: TypeScript 5.8+, Node.js (ES Modules, ECMAScript 2022)
- **Frameworks & Bundler**: React 19 (`react` 19.3, `react-dom` 19.3), Vite 8.3 (`@vitejs/plugin-react` 6.1)
- **Styling / UI**: Tailwind CSS v4 (`tailwindcss` 4.3, `@tailwindcss/vite`), Lucide React icons
- **Database / Cloud Sync**: Supabase (PostgreSQL 15+, Auth, Row-Level Security via `@supabase/supabase-js` 2.118)
- **Offline & Persistence Fallback**: Browser `localStorage` (`restaurant_daily_statements_v1`, `restaurant_expense_categories_v1`)
- **Data Visualization**: Recharts 3.10
- **Testing**: Vitest 5.0
- **Linter**: Oxlint 1.89

## Directory Structure

```text
/
├── public/                       # Static public assets
├── src/                          # Application source code
│   ├── assets/                   # Image assets and SVGs
│   ├── components/               # React UI components categorized by domain
│   │   ├── dashboard/            # Analytics dashboard & trend charts (Recharts)
│   │   ├── entry/                # Daily statement entry, sales channels, cash memos, expenses
│   │   ├── history/              # Historical daily statements list, search, and status filter
│   │   ├── layout/               # Header navbar, role toggle, and bottom navigation tabs
│   │   └── snapshot/             # Printable A4 daily statement report & PDF layout
│   ├── context/                  # React Context providers (AuthContext)
│   ├── lib/                      # Core business logic, pure calculations, and API helpers
│   │   ├── calculations.ts       # Integer paise arithmetic, conversions, reconciliation engine
│   │   └── supabase.ts           # Supabase client setup, URL sanitization, offline localStorage fallback
│   ├── tests/                    # Unit tests (Vitest)
│   │   └── calculations.test.ts  # Financial arithmetic and reconciliation test suite
│   ├── types/                    # Domain TypeScript type definitions
│   │   └── statement.ts          # DailyStatement, CashMemoItem, ExpenseItem, ReconciliationResult
│   ├── App.css                   # Print styling (@media print) and layout adjustments
│   ├── App.tsx                   # Top-level view orchestrator and statement state management
│   ├── index.css                 # Tailwind CSS v4 entry and base theme definitions
│   └── main.tsx                  # Application bootstrap and DOM mount
├── supabase/                     # Database migrations and schema definitions
│   └── schema.sql                # PostgreSQL schema with RLS policies, indexes, and triggers
├── .env.example                  # Environment variable template for Supabase credentials
├── .oxlintrc.json                # Oxlint linter configuration
├── index.html                    # Single-page application HTML entrypoint
├── package.json                  # Project manifest, dependencies, and npm scripts
├── tsconfig.app.json             # TypeScript configuration for the React application
├── tsconfig.json                 # TypeScript solution references configuration
├── tsconfig.node.json            # TypeScript configuration for Vite build configuration
└── vite.config.ts                # Vite build and plugin setup
```

## Key Commands

- **Dev Server**: `npm run dev` — Starts the Vite development server on `http://localhost:5173`
- **Build**: `npm run build` — Runs TypeScript project checks (`tsc -b`) and bundles for production via `vite build` to `dist/`
- **Test**: `npm test` — Executes the Vitest test suite (`vitest run`)
- **Lint / Format**: `npm run lint` — Runs Oxlint over the codebase (`oxlint`)
- **Preview Production Build**: `npm run preview` — Serves the production build locally

## Code Guidelines & Standards

- **Integer Paise Financial Precision**:
  - Always perform currency calculations using integer paise (1 INR = 100 paise) to eliminate floating-point rounding errors.
  - Never store floating-point rupee values in data models, database columns, or intermediate calculation states.
  - Use `rupeesToPaise()` and `paiseToRupees()` from [`calculations.ts`](file:///src/lib/calculations.ts) for conversions.
  - Use `formatPaiseToINR(paise)` for user-facing localized Indian Rupee currency display.
- **Offline-First & Graceful Degradation**:
  - The application must always function without Supabase configuration or network connectivity.
  - All database operations in [`supabase.ts`](file:///src/lib/supabase.ts) must back up to and restore from `localStorage` seamlessly.
- **Code Style & TypeScript Standards**:
  - Strict typing is enforced via `tsconfig.app.json`. Avoid `any`; define explicit models in [`statement.ts`](file:///src/types/statement.ts).
  - Validate all IDs with `isValidUuid()` before passing identifiers to Supabase PostgreSQL queries.
  - Prefer immutable state updates and pure functions for calculations and data transforms.
- **Testing Strategy**:
  - All financial math, conversions, reconciliation rules, and sanity checks must be tested in [`calculations.test.ts`](file:///src/tests/calculations.test.ts) using Vitest.
  - Cover edge cases including decimal floats (e.g., `0.10 + 0.20`), formatted currency strings with commas/symbols, negative values, and inverted memo number ranges.
- **Error Handling & Reconciliation**:
  - Validate reconciliation between physical book values (`entered_account_sales_paise`, `entered_account_expenses_paise`) and calculated item sums via `reconcileStatement()`.
  - Non-blocking discrepancies should be treated as warnings, whereas invalid business dates and negative cash amounts produce blocking validation errors.
- **Print / PDF Layout Consistency**:
  - Ensure any new UI elements added to [`DailySnapshotReport.tsx`](file:///src/components/snapshot/DailySnapshotReport.tsx) respect `@media print` rules in [`App.css`](file:///src/App.css), fitting cleanly on standard A4 paper without pagination clipping.
