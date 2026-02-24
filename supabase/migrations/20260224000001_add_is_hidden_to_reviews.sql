-- Add is_hidden column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.reviews.is_hidden IS 'Indicates whether the review is hidden from public view by the agent';
