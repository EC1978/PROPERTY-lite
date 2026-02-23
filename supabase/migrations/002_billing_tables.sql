-- ============================================
-- Billing Tables: subscriptions & invoices
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- ───────────────────────────────────────────
-- 1. Subscriptions table
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'Essential',
  status TEXT NOT NULL DEFAULT 'active',
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────
-- 2. Invoices table
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Betaald',
  download_url TEXT,
  document_type TEXT DEFAULT 'Factuur',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);
