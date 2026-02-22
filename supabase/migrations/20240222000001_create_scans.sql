-- Create scans table for QR analytics
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id TEXT REFERENCES public.agent_materials(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own scans"
    ON public.scans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert scans"
    ON public.scans FOR INSERT
    WITH CHECK (true); -- Anyone scanning the QR can insert a record

CREATE POLICY "Users can delete their own scans"
    ON public.scans FOR DELETE
    USING (auth.uid() = user_id);
