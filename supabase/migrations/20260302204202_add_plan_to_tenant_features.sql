ALTER TABLE public.tenant_features 
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Basic';
