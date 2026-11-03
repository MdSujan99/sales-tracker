# Architectural & Technical Decision Log (`decision.md`)

This log tracks architectural and technical decisions, fixes, and schema changes made across the project.
Whenever any change is made to existing code or schema, add an entry with the **Date**, **Reason**, and a **Short 1-2 line summary**.

---

## Decision Log

### 2026-11-04: Remove Wallet and Banknote Icons from Summary & Reconciliation Grid
- **Reason**: User requested removing the wallet and currency/banknote icons from the "CASH IN HAND" and "CASH SALES" metric cards for a cleaner, unified typography layout.
- **Change**: Removed the `<Banknote>` and `<Wallet>` Lucide React icons and cleaned up unused icon imports in [`ReconciliationBar.tsx`](file:///src/components/entry/ReconciliationBar.tsx).

### 2026-11-03: Code Coverage Tooling & Calculation Test Expansion
- **Reason**: Ensure continuous verification and measurement of test coverage for financial calculations, reconciliation logic, and feature updates.
- **Change**: Installed `@vitest/coverage-v8`, configured coverage reporter in [`vite.config.ts`](file:///vite.config.ts), added `"test:coverage": "vitest run --coverage"` in [`package.json`](file:///package.json), ignored `coverage/` in [`.gitignore`](file:///.gitignore), and added comprehensive tests in [`calculations.test.ts`](file:///src/tests/calculations.test.ts) covering negative memos/expenses, expense discrepancies, memo overflows, and finalized zero-sales statements.

### 2026-11-03: Date Range Selector in Sales Analysis
- **Reason**: Enable accountants and restaurant owners to filter sales analytics and trend charts by custom date ranges in addition to default quick filters.
- **Change**: Added `CUSTOM` range option and date range picker controls (From/To date inputs with range bounds, clear button, and result counter) in [`DashboardAnalytics.tsx`](file:///src/components/dashboard/DashboardAnalytics.tsx).

### 2026-11-03: Reset Entry Form After Finalizing Statement
- **Reason**: When finalizing a daily statement, the entry form retained the finalized statement state instead of resetting to a fresh blank entry ready for subsequent records.
- **Change**: In [`DailyEntryForm.tsx`](file:///src/components/entry/DailyEntryForm.tsx), clear the local draft and reset local state with `createBlankStatement()` upon finalization. In [`App.tsx`](file:///src/App.tsx), reset `activeStatement` to a clean blank draft when a statement is finalized.

### 2026-11-03: Summary & Reconciliation Section Theme Harmonization
- **Reason**: The "4. Summary & Reconciliation" card was hardcoded with pitch-black `bg-slate-900` and dark-only styles, clashing with the light/dark design system used across Sections 1, 2, and 3.
- **Change**: Refactored [`ReconciliationBar.tsx`](file:///src/components/entry/ReconciliationBar.tsx) to follow the unified theme palette (`bg-white dark:bg-slate-900` card container, `bg-slate-50 dark:bg-slate-800/60` stat tiles, unified typography hierarchy, theme-adaptive status alerts, and standard light/dark input fields).

### 2026-11-03: Gap Between Daily Statement Entry Title and New Entry Button
- **Reason**: The legacy Tailwind `space-x-3` utility failed to create spacing between the heading and "New Entry" button under Tailwind CSS v4 flex layout.
- **Change**: Replaced `space-x-3` with standard flex `gap-3` in [`DailyEntryForm.tsx`](file:///src/components/entry/DailyEntryForm.tsx).

### 2026-11-03: Terracotta Floating Navbar with White Active Tab
- **Reason**: The user requested the floating navigation bar to feature the terracotta primary background with a crisp white pill and black text for the active tab.
- **Change**: Updated [`TabNav.tsx`](file:///src/components/layout/TabNav.tsx) outer container to `bg-amber-600/95 dark:bg-amber-700/95`, active tab button style to `bg-white text-slate-900 shadow-md` with matching icon color, and inactive tabs to readable high-contrast warm white/amber tones (`text-amber-100/90 hover:bg-white/15`).

### 2026-11-03: Floating Bottom Navbar Height Adjustment
- **Reason**: The user requested the floating navigation bar to be taller for better touch ergonomics and visual prominence.
- **Change**: Updated [`TabNav.tsx`](file:///src/components/layout/TabNav.tsx) button vertical padding (`py-2.5 sm:py-3`), outer dock padding (`p-2 sm:p-2.5`), and icon sizing to provide a taller, more comfortable tap target.

### 2026-11-03: Tailwind v4 Class-Based Dark Mode Directive
- **Reason**: In Tailwind CSS v4, the `dark:` variant defaults strictly to media query `prefers-color-scheme`. Toggling `.dark` on `document.documentElement` did not apply dark classes without explicitly configuring the class variant.
- **Change**: Added `@custom-variant dark (&:where(.dark, .dark *));` to [`index.css`](file:///src/index.css) to enable manual class-based dark mode toggling.

### 2026-11-03: 3-Color Palette & Light/Dark Mode Switching
- **Reason**: The user requested a 3-color palette (Warm Terracotta/Amber primary, Slate neutral/backgrounds, and Indigo accent) with dark/light mode toggle support while retaining functional green, red, and yellow status colors.
- **Change**: Created [`ThemeContext.tsx`](file:///src/context/ThemeContext.tsx) with persistent mode storage and system-theme detection, integrated Sun/Moon toggle in [`Navbar.tsx`](file:///src/components/layout/Navbar.tsx), and added dark theme styles across entry forms, navigation, history, and analytics.

### 2026-11-03: Floating Bottom Navigation Dock
- **Reason**: The user requested the bottom navigation bar to be floating for an app-like feel.
- **Change**: Updated [`TabNav.tsx`](file:///src/components/layout/TabNav.tsx) into a floating pill dock (`fixed bottom-4 inset-x-0`, `max-w-lg`, `rounded-2xl`, `backdrop-blur-md`, `shadow-xl`) centered above the screen edge with smooth active tab highlights.

### 2026-11-03: Move Tab Navigation to Fixed Bottom Bar
- **Reason**: Mobile-first ergonomic usability allows quicker one-handed switching between Entry, Print Snapshot, History, and Dashboard.
- **Change**: Updated [`TabNav.tsx`](file:///src/components/layout/TabNav.tsx) to be fixed to the bottom (`fixed bottom-0 left-0 right-0 z-30`) with backdrop blur and responsive column-on-mobile layout, and increased [`App.tsx`](file:///src/App.tsx) main container bottom padding to `pb-24` to prevent content overlap.

### 2026-11-03: Numeric Date Format in Snapshot Report
- **Reason**: The user requested the statement date to be displayed strictly in numbers instead of spelled-out words/weekdays.
- **Change**: Updated [`DailySnapshotReport.tsx`](file:///src/components/snapshot/DailySnapshotReport.tsx) to format dates numerically as `DD/MM/YYYY`.

### 2026-11-03: Narrow Snapshot Width & Constrain PDF Print Margins
- **Reason**: The full A4-width table layout was too stretched horizontally for a minimal monospace receipt/statement.
- **Change**: Constrained screen width to `max-w-2xl` and print view to `max-w-xl` with centered auto-margins and `max-width: 600px` in [`DailySnapshotReport.tsx`](file:///src/components/snapshot/DailySnapshotReport.tsx) and [`index.css`](file:///src/index.css).

### 2026-11-03: Minimal Black & White Monospace PDF Print Layout with Clean Pagination
- **Reason**: The previous snapshot layout used colored backgrounds, rounded borders, and loose margins that broke unreliably across pages when printed or saved as PDF.
- **Change**: Redesigned [`DailySnapshotReport.tsx`](file:///src/components/snapshot/DailySnapshotReport.tsx) into a compact, purely text-based, black & white monospace report; updated [`index.css`](file:///src/index.css) `@media print` rules with explicit `break-inside: avoid` / `page-break-inside: avoid` per section and table row to prevent awkward splits.

### 2026-11-03: Remove Paper Total (Optional) Reconciliation Inputs
- **Reason**: The manual "Paper Total (optional)" input fields in both sales and expenses sections added unnecessary visual complexity and paper-book comparison fields to the daily entry workflow.
- **Change**: Completely removed the "Paper Total (optional)" input rows from `SalesChannelsSection.tsx` and `ExpensesSection.tsx`, and cleaned up the corresponding props in `DailyEntryForm.tsx`.

### 2026-11-03: Consolidate Custom Category Creation to Dropdown
- **Reason**: Having duplicate "+ New Category" triggers (an outer button beside Quick Add and an option inside the dropdown) created visual redundancy and confusion.
- **Change**: Removed the outer "+ New Category" button in `ExpensesSection.tsx`, making the dropdown's "+ New Category..." the single, clean creation trigger.

### 2026-11-03: Limit Quick Add Expense Options to Top 5 Categories
- **Reason**: The Daily Expenses section displayed all 12+ categories as quick-add pills, causing visual crowding on mobile and laptop screens.
- **Change**: Limited Quick Add pills to the top 5 most common restaurant cash expense categories, prioritized custom categories, and retained full access to all categories in the line-item dropdown.

### 2026-11-03: Single-User Role Switcher Removal & Text Noise Reduction
- **Reason**: The application is tailored for single-user operation (no multi-role switching required), and existing UI screens had excessive text descriptions and sublabels creating visual clutter.
- **Change**: Removed the 'Owner' / 'Accountant' role switcher in `Navbar.tsx`, updated signature blocks to generic roles, and stripped redundant instructional copy, calculation formulas, and verbose subtitles across all components for a cleaner, modern UX.

### 2026-11-03: Add `cash_in_hand_paise` column to Database Schema
- **Reason**: When clicking "Finalize Statement", Supabase PostgREST threw `Could not find the 'cash_in_hand_paise' column of 'daily_statements' in the schema cache` because the TypeScript model had `cash_in_hand_paise` but PostgreSQL was missing the column.
- **Change**: Updated `supabase/schema.sql` to add `cash_in_hand_paise BIGINT NOT NULL DEFAULT 0` to `daily_statements`, and added migration `supabase/migrations/20261103000000_add_cash_in_hand_paise.sql` with a backfill script.

### 2026-11-02: Single Statement Per Day Policy & Collision Warning
- **Reason**: Restaurants only have one Daily Cash Statement per calendar business date. Multiple entries for the same date cause accounting confusion and data collisions.
- **Change**: Enforced date collision check on entry form and save handler, locking duplicate statement creation for existing dates with an unlock workflow.

### 2026-11-02: Supabase URL Sanitization & Removal of Sample Mock Data
- **Reason**: Project URLs copied from Supabase dashboard often contained `/rest/v1` or trailing slashes, causing client connection failures, while sample test statements polluted live history.
- **Change**: Added `sanitizeSupabaseUrl()` and purged legacy mock statements from both code and browser `localStorage`.

### 2026-11-02: Integer Paise Currency Representation
- **Reason**: JavaScript IEEE 754 floating-point arithmetic introduces rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`) unacceptable for financial accounting.
- **Change**: Stored and calculated all monetary figures as 64-bit integer paise (1 INR = 100 paise), converting only at UI display boundary via `formatPaiseToINR()`.
