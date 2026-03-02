ALTER TABLE public.tenant_features
ADD COLUMN IF NOT EXISTS has_properties boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS has_reviews boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_materials boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_archive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_statistics boolean DEFAULT false;
