-- 1. Add role to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'makelaar';

-- 2. Create is_superadmin function
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create tenant_features table
CREATE TABLE IF NOT EXISTS public.tenant_features (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    has_agenda boolean DEFAULT false,
    has_leads boolean DEFAULT false,
    has_webshop boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 4. Create navigation_items table
CREATE TABLE IF NOT EXISTS public.navigation_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label text NOT NULL,
    icon text,
    path text NOT NULL,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on new tables
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

-- 6. Policies for tenant_features
CREATE POLICY "Users can view own tenant features" 
ON public.tenant_features FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can do all on tenant features" 
ON public.tenant_features 
USING (public.is_superadmin());

-- 7. Policies for navigation_items
CREATE POLICY "Users can view own navigation items" 
ON public.navigation_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own navigation items" 
ON public.navigation_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can do all on navigation items" 
ON public.navigation_items 
USING (public.is_superadmin());

-- 8. Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tenant_features_updated_at ON public.tenant_features;
CREATE TRIGGER update_tenant_features_updated_at
BEFORE UPDATE ON public.tenant_features
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_navigation_items_updated_at ON public.navigation_items;
CREATE TRIGGER update_navigation_items_updated_at
BEFORE UPDATE ON public.navigation_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
