-- Messages anonymes dans les cercles de soutien — après supabase_confessional_support_groups.sql

CREATE TABLE IF NOT EXISTS public.confessional_support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.confessional_support_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS confessional_support_messages_group_idx
  ON public.confessional_support_messages (group_id, created_at DESC);

ALTER TABLE public.confessional_support_messages ENABLE ROW LEVEL SECURITY;

-- Lecture : membres du cercle uniquement
CREATE POLICY "support_messages_select_member"
  ON public.confessional_support_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.confessional_support_group_members m
      WHERE m.group_id = confessional_support_messages.group_id
        AND m.user_id = auth.uid()
    )
  );

-- Insertion : membre + auteur = soi
CREATE POLICY "support_messages_insert_member"
  ON public.confessional_support_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.confessional_support_group_members m
      WHERE m.group_id = confessional_support_messages.group_id
        AND m.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.confessional_support_messages IS 'Chat anonyme cercle (contenu chiffré côté API TKV).';
