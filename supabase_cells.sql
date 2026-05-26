-- Cellules mondiales — messages par salle
-- Exécuter dans Supabase SQL Editor

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS cell_slug text NOT NULL DEFAULT 'global';

CREATE INDEX IF NOT EXISTS messages_cell_slug_created_idx
  ON public.messages (cell_slug, created_at DESC);

-- Realtime : activer la réplication sur messages si ce n’est pas déjà fait
-- Dashboard → Database → Replication → messages
