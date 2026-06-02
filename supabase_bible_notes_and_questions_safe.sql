-- Bible verse notes + highlights + question post type (safe/idempotent)
-- Run in Supabase SQL Editor.

DO $$
BEGIN
  IF to_regclass('public.community_posts') IS NULL THEN
    RAISE EXCEPTION 'Missing table: public.community_posts';
  END IF;
  IF to_regclass('public.friend_requests') IS NULL THEN
    RAISE EXCEPTION 'Missing table: public.friend_requests';
  END IF;
END
$$;

-- Community post type: add "question"
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'post';

ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_post_type_check;

ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_post_type_check
  CHECK (post_type IN ('post', 'testimony', 'question'));

-- Bible notes and highlights per verse
CREATE TABLE IF NOT EXISTS public.bible_verse_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  chapter_num integer NOT NULL CHECK (chapter_num > 0),
  verse_num integer NOT NULL CHECK (verse_num > 0),
  verse_ref text NOT NULL,
  highlighted boolean NOT NULL DEFAULT false,
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 2000),
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'friends', 'public')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS bible_verse_notes_user_verse_uidx
  ON public.bible_verse_notes (user_id, verse_ref);

CREATE INDEX IF NOT EXISTS bible_verse_notes_ref_idx
  ON public.bible_verse_notes (book_id, chapter_num, verse_num, updated_at DESC);

CREATE INDEX IF NOT EXISTS bible_verse_notes_visibility_idx
  ON public.bible_verse_notes (visibility, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_bible_verse_notes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bible_verse_notes_updated_at ON public.bible_verse_notes;
CREATE TRIGGER trg_bible_verse_notes_updated_at
BEFORE UPDATE ON public.bible_verse_notes
FOR EACH ROW
EXECUTE FUNCTION public.set_bible_verse_notes_updated_at();

ALTER TABLE public.bible_verse_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bible_verse_notes_select_visible" ON public.bible_verse_notes;
CREATE POLICY "bible_verse_notes_select_visible"
  ON public.bible_verse_notes
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR visibility = 'public'
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1
        FROM public.friend_requests fr
        WHERE fr.status = 'accepted'
          AND (
            (fr.from_user_id = auth.uid() AND fr.to_user_id = bible_verse_notes.user_id)
            OR (fr.to_user_id = auth.uid() AND fr.from_user_id = bible_verse_notes.user_id)
          )
      )
    )
  );

DROP POLICY IF EXISTS "bible_verse_notes_insert_own" ON public.bible_verse_notes;
CREATE POLICY "bible_verse_notes_insert_own"
  ON public.bible_verse_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bible_verse_notes_update_own" ON public.bible_verse_notes;
CREATE POLICY "bible_verse_notes_update_own"
  ON public.bible_verse_notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bible_verse_notes_delete_own" ON public.bible_verse_notes;
CREATE POLICY "bible_verse_notes_delete_own"
  ON public.bible_verse_notes
  FOR DELETE
  USING (auth.uid() = user_id);
