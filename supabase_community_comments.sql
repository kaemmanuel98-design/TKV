-- Community wall comments (Facebook/Instagram style)
-- Run this in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) >= 1 AND char_length(content) <= 1000),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS community_comments_post_created_idx
  ON public.community_comments (post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS community_comments_user_created_idx
  ON public.community_comments (user_id, created_at DESC);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_comments_select_all" ON public.community_comments;
CREATE POLICY "community_comments_select_all"
  ON public.community_comments
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "community_comments_insert_authenticated" ON public.community_comments;
CREATE POLICY "community_comments_insert_authenticated"
  ON public.community_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_comments_delete_owner_or_super_admin" ON public.community_comments;
CREATE POLICY "community_comments_delete_owner_or_super_admin"
  ON public.community_comments
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_companion_super_admin = true
    )
  );
