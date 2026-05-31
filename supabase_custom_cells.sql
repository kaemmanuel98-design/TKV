-- Cellules personnalisées (Premium+ et animateurs TKV)
-- Exécuter dans Supabase SQL Editor après supabase_cells.sql

CREATE TABLE IF NOT EXISTS public.cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  language text NOT NULL DEFAULT 'fr',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT cells_slug_format CHECK (
    slug ~ '^c-[a-z0-9_-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 32
  ),
  CONSTRAINT cells_name_len CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 80),
  CONSTRAINT cells_description_len CHECK (description IS NULL OR char_length(description) <= 280)
);

CREATE INDEX IF NOT EXISTS cells_created_at_idx ON public.cells (created_at DESC);
CREATE INDEX IF NOT EXISTS cells_created_by_idx ON public.cells (created_by);

ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cells_read_all" ON public.cells;
CREATE POLICY "cells_read_all"
  ON public.cells FOR SELECT
  USING (true);

-- Création / modification via l'API TKV (service role) uniquement
