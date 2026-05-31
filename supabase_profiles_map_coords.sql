-- Coordonnées précises pour la carte du Royaume (exécuter une fois dans Supabase SQL Editor)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS map_address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

COMMENT ON COLUMN public.profiles.map_address IS 'Adresse ou lieu affiché sur la carte du Royaume.';
COMMENT ON COLUMN public.profiles.latitude IS 'Latitude WGS84 pour le marqueur carte.';
COMMENT ON COLUMN public.profiles.longitude IS 'Longitude WGS84 pour le marqueur carte.';
