-- Migration: 013_mollie_settings.sql
-- Description: Add Mollie specific configuration columns

ALTER TABLE platform_settings
ADD COLUMN IF NOT EXISTS mollie_test_api_key TEXT,
ADD COLUMN IF NOT EXISTS mollie_live_api_key TEXT,
ADD COLUMN IF NOT EXISTS mollie_is_test_mode BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mollie_webhook_url TEXT;

-- Update the comments for clarity
COMMENT ON COLUMN platform_settings.mollie_api_key IS 'Standard/Legacy Mollie API key';
COMMENT ON COLUMN platform_settings.mollie_test_api_key IS 'Mollie Test API key (starting with test_)';
COMMENT ON COLUMN platform_settings.mollie_live_api_key IS 'Mollie Live API key (starting with live_)';
COMMENT ON COLUMN platform_settings.mollie_is_test_mode IS 'Flag to determine if we are in testing or production';
