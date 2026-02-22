-- Add metadata columns to scans for enhanced analytics
ALTER TABLE public.scans 
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS device TEXT,
ADD COLUMN IF NOT EXISTS os TEXT,
ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Index for performance on analytics queries
CREATE INDEX IF NOT EXISTS scans_material_id_idx ON public.scans(material_id);
CREATE INDEX IF NOT EXISTS scans_property_id_idx ON public.scans(property_id);
