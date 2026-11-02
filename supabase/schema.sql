-- ==============================================================================
-- RESTAURANT DAILY SALES SNAPSHOT - SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Restaurants Profile
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Predefined & Custom Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Daily Statements
CREATE TABLE IF NOT EXISTS public.daily_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    business_date DATE NOT NULL,
    statement_number TEXT,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'FINALIZED')),
    
    -- Monetary amounts stored in integer paise (1 INR = 100 paise)
    cash_sales_paise BIGINT NOT NULL DEFAULT 0,
    upi_sales_paise BIGINT NOT NULL DEFAULT 0,
    card_sales_paise BIGINT NOT NULL DEFAULT 0,
    delivery_sales_paise BIGINT NOT NULL DEFAULT 0,
    other_sales_paise BIGINT NOT NULL DEFAULT 0,
    total_sales_paise BIGINT NOT NULL DEFAULT 0,
    
    total_expenses_paise BIGINT NOT NULL DEFAULT 0,
    total_cash_memos_paise BIGINT NOT NULL DEFAULT 0,
    net_difference_paise BIGINT NOT NULL DEFAULT 0,
    
    -- Optional fields from paper statement comparison
    entered_account_sales_paise BIGINT,
    entered_account_expenses_paise BIGINT,
    closing_cash_paise BIGINT,
    notes TEXT,
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(restaurant_id, business_date)
);

-- 5. Cash Memos
CREATE TABLE IF NOT EXISTS public.cash_memos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    statement_id UUID NOT NULL REFERENCES public.daily_statements(id) ON DELETE CASCADE,
    from_number TEXT,
    to_number TEXT,
    source TEXT,
    amount_paise BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Itemized Expenses
CREATE TABLE IF NOT EXISTS public.expense_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    statement_id UUID NOT NULL REFERENCES public.daily_statements(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    description TEXT,
    amount_paise BIGINT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Automated updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_daily_statements_updated_at ON public.daily_statements;
CREATE TRIGGER trigger_daily_statements_updated_at
    BEFORE UPDATE ON public.daily_statements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full read/write access to restaurant records
CREATE POLICY "Allow authenticated read on restaurants" 
    ON public.restaurants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access on expense_categories" 
    ON public.expense_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access on daily_statements" 
    ON public.daily_statements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access on cash_memos" 
    ON public.cash_memos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access on expense_entries" 
    ON public.expense_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read/write for local demo/development if needed
-- (Uncomment below if using Supabase Anon Key without login for testing)
/*
CREATE POLICY "Allow anon read/write for development" 
    ON public.daily_statements FOR ALL TO anon USING (true) WITH CHECK (true);
*/

-- ==============================================================================
-- DEFAULT SEED DATA
-- ==============================================================================

-- 1. Default Restaurant
INSERT INTO public.restaurants (id, name, address, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 'Restaurant Cash Statement', 'Main Branch', 'INR')
ON CONFLICT (id) DO NOTHING;

-- 2. Predefined Common Expense Categories matching paper cash statement
INSERT INTO public.expense_categories (restaurant_id, name, display_order)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Vegetables / Mandi', 1),
    ('00000000-0000-0000-0000-000000000001', 'Meat / Poultry / Fish', 2),
    ('00000000-0000-0000-0000-000000000001', 'Dairy / Milk / Paneer', 3),
    ('00000000-0000-0000-0000-000000000001', 'Bakery / Breads', 4),
    ('00000000-0000-0000-0000-000000000001', 'Gas / Commercial Cylinders', 5),
    ('00000000-0000-0000-0000-000000000001', 'Packaging & Disposables', 6),
    ('00000000-0000-0000-0000-000000000001', 'Daily Wages / Labour', 7),
    ('00000000-0000-0000-0000-000000000001', 'Maintenance & Repairs', 8),
    ('00000000-0000-0000-0000-000000000001', 'Cleaning & Sanitation', 9),
    ('00000000-0000-0000-0000-000000000001', 'Ice & Beverages', 10),
    ('00000000-0000-0000-0000-000000000001', 'Staff Tea & Refreshment', 11),
    ('00000000-0000-0000-0000-000000000001', 'Miscellaneous Cash Expenses', 12)
ON CONFLICT DO NOTHING;
