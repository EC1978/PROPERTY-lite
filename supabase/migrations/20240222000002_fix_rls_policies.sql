-- Allow public access to agent_materials for QR redirection scans
CREATE POLICY "Allow public select on materials for QR"
    ON public.agent_materials FOR SELECT
    USING (true);
