-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: hlzkznjdpkazeeisvkev

ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS letterhead_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS letterhead_enabled BOOLEAN DEFAULT FALSE;
