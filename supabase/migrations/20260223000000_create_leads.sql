-- ============================================================
-- Migration: Create leads & lead_chat_messages tables
-- Date: 2026-02-23
-- ============================================================

-- 1. Leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiation', 'closed')),
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    is_hot BOOLEAN NOT NULL DEFAULT false,
    message TEXT,
    image TEXT NOT NULL DEFAULT '',
    wensen TEXT,
    budget TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Lead chat messages table
CREATE TABLE IF NOT EXISTS public.lead_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('ai', 'lead')),
    message TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for leads
CREATE POLICY "Users can view their own leads"
    ON public.leads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
    ON public.leads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
    ON public.leads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
    ON public.leads FOR DELETE
    USING (auth.uid() = user_id);

-- 5. RLS Policies for lead_chat_messages (via lead ownership)
CREATE POLICY "Users can view chat messages for their leads"
    ON public.lead_chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = lead_chat_messages.lead_id
            AND leads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chat messages for their leads"
    ON public.lead_chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = lead_chat_messages.lead_id
            AND leads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chat messages for their leads"
    ON public.lead_chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = lead_chat_messages.lead_id
            AND leads.user_id = auth.uid()
        )
    );

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score);
CREATE INDEX IF NOT EXISTS idx_lead_chat_messages_lead_id ON public.lead_chat_messages(lead_id);
