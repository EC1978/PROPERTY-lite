-- ============================================
-- Letterhead Feature
-- ============================================

-- 1. Add letterhead_url to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS letterhead_url TEXT;

-- 2. Create Storage Bucket for letterheads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('letterheads', 'letterheads', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policies for letterheads
CREATE POLICY "Letterheads are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'letterheads' );

CREATE POLICY "Users can upload their own letterheads."
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'letterheads' AND 
    auth.uid() = owner
  );

CREATE POLICY "Users can update their own letterheads."
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'letterheads' AND 
    auth.uid() = owner
  );

CREATE POLICY "Users can delete their own letterheads."
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'letterheads' AND 
    auth.uid() = owner
  );
