-- =============================================================================
-- Migration: 005_email_settings.sql
-- Description: Creates tables for email templates (managed by superadmin) and
-- user email preferences (managed by brokers to toggle automated emails).
-- =============================================================================

-- ========================================================
-- 1. Create Tables
-- ========================================================

-- Table: public.email_templates
-- Stores the global email templates available in the system.
CREATE TABLE public.email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: public.user_email_preferences
-- Stores whether a specific broker has enabled or disabled a particular email template.
CREATE TABLE public.user_email_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, template_id)
);

-- ========================================================
-- 2. Indexes
-- ========================================================

CREATE INDEX idx_user_email_preferences_user_id ON public.user_email_preferences(user_id);
CREATE INDEX idx_user_email_preferences_template_id ON public.user_email_preferences(template_id);

-- ========================================================
-- 3. Row Level Security (RLS)
-- ========================================================

-- email_templates
-- --------------------------------------------------------
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view templates
CREATE POLICY "Templates are viewable by all authenticated users" 
ON public.email_templates FOR SELECT 
TO authenticated 
USING (true);

-- user_email_preferences
-- --------------------------------------------------------
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own preferences
CREATE POLICY "Users can view their own email preferences" 
ON public.user_email_preferences FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert their own email preferences" 
ON public.user_email_preferences FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update their own email preferences" 
ON public.user_email_preferences FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- 4. Seed Initial Email Templates
-- ========================================================

-- Insert standard email templates if they don't exist yet
INSERT INTO public.email_templates (name, subject, html_body, text_body)
VALUES 
    (
        'Welkomstmail', 
        'Welkom bij VoiceRealty AI!', 
        '<h1>Welkom!</h1><p>We zijn blij dat je aan boord bent.</p>', 
        'Welkom! We zijn blij dat je aan boord bent.'
    ),
    (
        'Afspraakbevestiging', 
        'Uw afspraak is bevestigd', 
        '<h1>Afspraak Bevestigd</h1><p>Uw afspraak voor de bezichtiging staat gepland.</p>', 
        'Uw afspraak voor de bezichtiging staat gepland.'
    ),
    (
        'Review Verzoek', 
        'Hoe was uw ervaring?', 
        '<h1>Deel uw ervaring</h1><p>We horen graag hoe uw ervaring was. Klik hier om een review achter te laten.</p>', 
        'Deel uw ervaring. We horen graag hoe uw ervaring was.'
    )
ON CONFLICT (name) DO NOTHING;
