-- ============================================
-- Migration: 010_system_settings.sql
-- Description: System maintenance mode and status configuration
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY CHECK (id = 1), -- Singleton constraint
    maintenance_mode BOOLEAN DEFAULT false,
    live_status_message TEXT DEFAULT 'Alle systemen operationeel',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Restrict all access except for the service_role
-- The backend will use the Supabase service role key to read/update this table.
CREATE POLICY "Allow service_role read access" ON system_settings
    FOR SELECT
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow service_role update access" ON system_settings
    FOR UPDATE
    USING (auth.role() = 'service_role');

-- Insert initial single row
INSERT INTO system_settings (id, maintenance_mode, live_status_message) 
VALUES (1, false, 'Alle systemen operationeel')
ON CONFLICT (id) DO NOTHING;
