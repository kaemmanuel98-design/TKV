-- Confessionnal TKV — journal spirituel privé (CdC : données sensibles, RGPD)
-- Exécuter après supabase_init.sql

CREATE TABLE IF NOT EXISTS public.confession_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  examen_thankful text,
  examen_review text,
  examen_growth text,
  confession_text text,
  resolution_text text,
  grace_verse_key text,
  grace_word text,
  completed boolean DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS confession_sessions_user_idx
  ON public.confession_sessions (user_id, created_at DESC);

ALTER TABLE public.confession_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "confession_select_own"
  ON public.confession_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "confession_insert_own"
  ON public.confession_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "confession_update_own"
  ON public.confession_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "confession_delete_own"
  ON public.confession_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.confession_sessions IS
  'Sessions privées du confessionnal TKV — visibles uniquement par leur auteur.';
