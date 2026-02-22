-- Voeg voorbeeld materialen toe voor de huidige ingelogde gebruiker
-- Let op: Vervang 'UW_USER_ID' door je eigen user_id (te vinden in de Supabase Auth tabel)
-- Of gebruik deze query om het voor de eerste makelaar in de lijst te doen:

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Probeer de huidige user_id te vinden (werkt alleen in de context van de app, 
    -- maar voor de SQL editor pakken we de eerste gebruiker die we vinden)
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.agent_materials (id, user_id, name, type, image_url, active_property_id)
        VALUES 
            ('bord-01', target_user_id, 'Stoepbord Entree', 'Stoepbord', 'https://images.unsplash.com/photo-1590073242116-2e724e584d08?auto=format&fit=crop&q=80&w=400', NULL),
            ('bord-02', target_user_id, 'Tuinbord XL', 'Tuinbord', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400', NULL),
            ('sticker-01', target_user_id, 'Raamsticker Noord', 'Raamsticker', 'https://images.unsplash.com/photo-1541829070764-84a7d30dee7a?auto=format&fit=crop&q=80&w=400', NULL)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
