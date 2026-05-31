-- Gamification sur profil (badges + progression lecture / parcours)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reading_progress integer DEFAULT 0;
