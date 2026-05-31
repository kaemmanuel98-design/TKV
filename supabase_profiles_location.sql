-- Persistance pays / ville / carte du Royaume (exécuter une fois dans Supabase SQL Editor)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS show_on_map boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.country IS 'Pays affiché sur la carte du Royaume.';
COMMENT ON COLUMN public.profiles.city IS 'Ville affichée sur la carte du Royaume.';
COMMENT ON COLUMN public.profiles.show_on_map IS 'Opt-in visibilité sur la carte du Royaume.';
