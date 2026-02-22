-- Create agent_materials table
CREATE TABLE IF NOT EXISTS public.agent_materials (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    makelaar_id UUID DEFAULT auth.uid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    image_url TEXT,
    active_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agent_materials ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own materials"
    ON public.agent_materials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials"
    ON public.agent_materials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
    ON public.agent_materials FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
    ON public.agent_materials FOR DELETE
    USING (auth.uid() = user_id);
