-- Carte du Royaume : opt-in affichage sur la carte (après supabase_migration_v3.sql)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_on_map boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.show_on_map IS
  'Si true et country renseigné, le profil apparaît sur la carte du Royaume (position approximative par pays).';
