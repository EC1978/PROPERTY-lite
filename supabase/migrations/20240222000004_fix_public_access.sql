-- Ensure public access for QR functionality
-- 1. Materials must be viewable by anyone (for ID lookup)
DROP POLICY IF EXISTS "Allow public select on materials for QR" ON public.agent_materials;
CREATE POLICY "Allow public select on materials for QR"
    ON public.agent_materials FOR SELECT
    USING (true);

-- 2. Properties must be viewable by anyone (for public view page)
-- Check if the policy already exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'properties' 
        AND policyname = 'Allow public select on properties'
    ) THEN
        CREATE POLICY "Allow public select on properties"
            ON public.properties FOR SELECT
            USING (true);
    END IF;
END
$$;

-- 3. Scans must be insertable by anyone
DROP POLICY IF EXISTS "Users can insert scans" ON public.scans;
CREATE POLICY "Users can insert scans"
    ON public.scans FOR INSERT
    WITH CHECK (true);
