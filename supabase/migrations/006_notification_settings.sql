-- Migration: 006_notification_settings.sql
-- Description: Create user notification preferences table for Makelaars

-- 1. Create Enum for notification types
CREATE TYPE notification_type AS ENUM ('new_lead', 'new_review', 'system_updates');

-- 2. Create the table for user notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Ensure each user has only one preference row per notification type
    UNIQUE(user_id, type)
);

-- 3. Add an index for faster lookups by user and type
CREATE INDEX IF NOT EXISTS idx_user_notification_prefs_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_prefs_type ON user_notification_preferences(type);

-- 4. Enable Row Level Security
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies

-- Users can view their own notification preferences
CREATE POLICY "Users can view their own notification preferences" 
    ON user_notification_preferences 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert their own notification preferences" 
    ON user_notification_preferences 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update their own notification preferences" 
    ON user_notification_preferences 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notification preferences
CREATE POLICY "Users can delete their own notification preferences" 
    ON user_notification_preferences 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_notification_preferences_updated_at_trigger
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_notification_preferences_updated_at();

-- Note: We are using a predefined Enum ('new_lead', 'new_review', 'system_updates') 
-- as requested by the requirements instead of a dynamic template table.
-- If new types are needed later, we can ALTER TYPE notification_type ADD VALUE 'new_type';
