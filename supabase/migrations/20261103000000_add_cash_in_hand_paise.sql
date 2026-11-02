-- Migration: Add cash_in_hand_paise to daily_statements
-- Description: Adds missing cash_in_hand_paise column (integer paise) to store Cash in Hand (Cash Sales - Total Expenses)

ALTER TABLE public.daily_statements 
ADD COLUMN IF NOT EXISTS cash_in_hand_paise BIGINT NOT NULL DEFAULT 0;

-- Optional backfill for existing rows: cash_in_hand = cash_sales - total_expenses
UPDATE public.daily_statements
SET cash_in_hand_paise = cash_sales_paise - total_expenses_paise
WHERE cash_in_hand_paise = 0 AND (cash_sales_paise != 0 OR total_expenses_paise != 0);
