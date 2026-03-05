-- Add updated_at column to shop_complaints if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_complaints' AND column_name = 'updated_at') THEN
        ALTER TABLE public.shop_complaints ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Create or replace the updated_at trigger if it doesn't exist
-- We use the existing update_updated_at_column() function from 012_superadmin_features.sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shop_complaints_updated_at') THEN
        CREATE TRIGGER update_shop_complaints_updated_at
        BEFORE UPDATE ON public.shop_complaints
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
