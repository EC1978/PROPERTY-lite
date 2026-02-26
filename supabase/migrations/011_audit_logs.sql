-- Migration for Audit Logs

-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but since we use service_role to insert/read, we don't strictly need specific policies for anon/authenticated
-- However, good practice to enable it so normal users cannot do anything
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Optional: Allow read access for authenticated admins only if they query directly from client, 
-- but our plan uses Action functions with service_role key, so we can keep it locked down.
-- Let's just create a policy that denies everything to normal client flows, just to be safe.
CREATE POLICY "Deny all client access to audit_logs" 
    ON public.audit_logs 
    FOR ALL 
    USING (false);

-- Grant permissions to authenticated service_role (service role bypasses RLS anyway)
GRANT ALL ON TABLE public.audit_logs TO service_role;
