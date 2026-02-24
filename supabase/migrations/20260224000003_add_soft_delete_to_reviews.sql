-- Add soft delete column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.reviews.is_deleted IS 'Soft delete flag. True means the review is in the trash bin and not permanently removed.';
