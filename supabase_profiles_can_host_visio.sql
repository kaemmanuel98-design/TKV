-- Droit de créer une réunion visio (animateur) : fondateur / rôles spéciaux
-- Les membres Premium+ ont aussi ce droit via plan_type = 'premium_plus' (côté API).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_host_visio boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.can_host_visio IS
  'Si true, l''utilisateur peut créer une réunion Jitsi (JWT modérateur), en plus des Premium+.';
