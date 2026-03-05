-- Add status and admin_response safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_complaints' AND column_name = 'status') THEN
        ALTER TABLE public.shop_complaints ADD COLUMN status TEXT DEFAULT 'In behandeling';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_complaints' AND column_name = 'admin_response') THEN
        ALTER TABLE public.shop_complaints ADD COLUMN admin_response TEXT;
    END IF;
END $$;
