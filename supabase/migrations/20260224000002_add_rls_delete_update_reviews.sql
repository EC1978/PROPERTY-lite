-- Add DELETE policy: only the agent who owns the property can delete its reviews
CREATE POLICY "Agent can delete reviews of their properties"
    ON public.reviews
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE properties.id = reviews.property_id
            AND properties.user_id = auth.uid()
        )
    );

-- Add UPDATE policy: only the agent who owns the property can update (hide/show) its reviews
CREATE POLICY "Agent can update reviews of their properties"
    ON public.reviews
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE properties.id = reviews.property_id
            AND properties.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE properties.id = reviews.property_id
            AND properties.user_id = auth.uid()
        )
    );
