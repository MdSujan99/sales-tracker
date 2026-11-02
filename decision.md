# Architectural & Technical Decision Log (`decision.md`)

This log tracks architectural and technical decisions, fixes, and schema changes made across the project.
Whenever any change is made to existing code or schema, add an entry with the **Date**, **Reason**, and a **Short 1-2 line summary**.

---

## Decision Log

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
