-- Ville sur la carte du Royaume (optionnel, affichage ville + maison)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text;

COMMENT ON COLUMN public.profiles.city IS
  'Ville affichée sur la carte du Royaume (ex. Paris, Abidjan). Approximatif pour la vie privée.';
