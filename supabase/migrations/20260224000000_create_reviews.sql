-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    reviewer_name TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Insert Policy: Anyone can insert a review (anonymous buyers)
CREATE POLICY "Anyone can insert reviews" 
    ON public.reviews 
    FOR INSERT 
    WITH CHECK (true);

-- Select Policy: Only logged-in agent (who owns the property) can select/view reviews
CREATE POLICY "Agent can view reviews of their properties" 
    ON public.reviews 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE properties.id = reviews.property_id
            AND properties.user_id = auth.uid()
        )
    );

-- Create index for faster lookups by property
CREATE INDEX IF NOT EXISTS reviews_property_id_idx ON public.reviews(property_id);
