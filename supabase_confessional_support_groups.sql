-- Cercles de soutien Confessionnal v1 — après supabase_compessional_cdc.sql

CREATE TABLE IF NOT EXISTS public.confessional_support_groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  situation text NOT NULL,
  title text NOT NULL,
  description text,
  language text DEFAULT 'fr' NOT NULL,
  is_open boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.confessional_support_group_members (
  group_id uuid REFERENCES public.confessional_support_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS confessional_support_members_user_idx
  ON public.confessional_support_group_members (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS confessional_support_groups_situation_lang
  ON public.confessional_support_groups (situation, language);

ALTER TABLE public.confessional_support_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confessional_support_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_groups_select_authenticated"
  ON public.confessional_support_groups FOR SELECT TO authenticated
  USING (is_open = true);

CREATE POLICY "support_members_select_own"
  ON public.confessional_support_group_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "support_members_insert_own"
  ON public.confessional_support_group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "support_members_delete_own"
  ON public.confessional_support_group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Catalogue initial (FR)
INSERT INTO public.confessional_support_groups (situation, title, description, language)
VALUES
  ('depression', 'Cercle — Tristesse et épreuve', 'Un espace anonyme où d''autres personnes traversent des moments difficiles, comme vous.', 'fr'),
  ('grief', 'Cercle — Deuil', 'Partager le chemin du deuil, sans jugement.', 'fr'),
  ('addiction', 'Cercle — Libération', 'Se soutenir mutuellement dans la lutte et l''espérance.', 'fr'),
  ('family', 'Cercle — Famille', 'Quand la famille blesse ou se fracture.', 'fr'),
  ('spiritual', 'Cercle — Doute et foi', 'Questionner, chercher, ne pas rester seul dans le doute.', 'fr'),
  ('other', 'Cercle — Autres épreuves', 'Toute souffrance qui mérite d''être entendue.', 'fr')
ON CONFLICT (situation, language) DO NOTHING;
