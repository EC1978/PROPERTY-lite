-- ============================================
-- Migration: 003_platform_settings.sql
-- Description: Superadmin configuration for Mollie and invoices
-- ============================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY CHECK (id = 1), -- Singleton constraint
  mollie_api_key TEXT,
  active_payment_methods TEXT[] DEFAULT '{}',
  invoice_logo_url TEXT,
  invoice_company_details JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ───────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only service_role can access this table by default since we want to keep it hidden 
-- from public or authenticated regular users. 
-- Server actions will use a service role or a client that bypasses RLS (if acting as admin),
-- but assuming standard Server Actions might use user's session, we either need
-- to query this using service_role key, or give specific access.
-- We will restrict it completely and use supabase admin client in the backend.

-- Initial single row
INSERT INTO platform_settings (id, active_payment_methods) 
VALUES (1, '{"ideal", "creditcard", "paypal"}')
ON CONFLICT (id) DO NOTHING;
