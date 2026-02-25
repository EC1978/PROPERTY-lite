-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Beheerder', 'Makelaar')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(broker_id, email)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Brokers can view their own team members" 
    ON public.team_members FOR SELECT 
    USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can insert their own team members" 
    ON public.team_members FOR INSERT 
    WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Brokers can update their own team members" 
    ON public.team_members FOR UPDATE 
    USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can delete their own team members" 
    ON public.team_members FOR DELETE 
    USING (auth.uid() = broker_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for team_members
DROP TRIGGER IF EXISTS handle_team_members_updated_at ON public.team_members;
CREATE TRIGGER handle_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
