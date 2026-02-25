-- ============================================
-- Migration: 20260225000001_integration_settings.sql
-- Description: Phase 5 - Integration Tools Settings
-- ============================================

-- 1. Add global integration keys to platform_settings
ALTER TABLE platform_settings
ADD COLUMN IF NOT EXISTS google_client_id TEXT,
ADD COLUMN IF NOT EXISTS google_client_secret TEXT,
ADD COLUMN IF NOT EXISTS microsoft_client_id TEXT,
ADD COLUMN IF NOT EXISTS realworks_global_api_key TEXT;

-- 2. Create user_integrations table for makelaars
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., 'google', 'microsoft', 'realworks'
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    provider_account_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider) -- One active connection per provider per user
);

-- 3. Enable RLS on user_integrations
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_integrations

-- Users can view their own integrations
CREATE POLICY "Users can view own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own integrations
CREATE POLICY "Users can insert own integrations"
    ON user_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "Users can update own integrations"
    ON user_integrations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own integrations
CREATE POLICY "Users can delete own integrations"
    ON user_integrations FOR DELETE
    USING (auth.uid() = user_id);
