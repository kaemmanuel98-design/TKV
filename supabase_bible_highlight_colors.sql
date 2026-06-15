-- Couleurs de surlignage des versets (safe/idempotent)
-- Exécuter dans l'éditeur SQL Supabase après supabase_bible_notes_and_questions_safe.sql

DO $$
BEGIN
  IF to_regclass('public.bible_verse_notes') IS NULL THEN
    RAISE EXCEPTION 'Missing table: public.bible_verse_notes — exécutez d''abord supabase_bible_notes_and_questions_safe.sql';
  END IF;
END
$$;

ALTER TABLE public.bible_verse_notes
  ADD COLUMN IF NOT EXISTS highlight_color text;

ALTER TABLE public.bible_verse_notes
  DROP CONSTRAINT IF EXISTS bible_verse_notes_highlight_color_check;

ALTER TABLE public.bible_verse_notes
  ADD CONSTRAINT bible_verse_notes_highlight_color_check
  CHECK (
    highlight_color IS NULL
    OR highlight_color IN ('yellow', 'green', 'blue', 'pink', 'purple', 'orange')
  );

CREATE INDEX IF NOT EXISTS bible_verse_notes_user_highlight_idx
  ON public.bible_verse_notes (user_id, highlight_color, updated_at DESC)
  WHERE highlight_color IS NOT NULL OR highlighted = true;

-- Rétrocompatibilité : anciennes lignes surlignées sans couleur → jaune
UPDATE public.bible_verse_notes
SET highlight_color = 'yellow'
WHERE highlighted = true
  AND (highlight_color IS NULL OR highlight_color = '');
