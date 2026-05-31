-- Progression modules de parcours (sync multi-appareils)

CREATE TABLE IF NOT EXISTS public.course_module_progress (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_slug text NOT NULL,
  module_index integer NOT NULL,
  completed_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  PRIMARY KEY (user_id, course_slug, module_index)
);

CREATE INDEX IF NOT EXISTS course_module_progress_user_idx
  ON public.course_module_progress (user_id);

ALTER TABLE public.course_module_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateur gère sa progression cours" ON public.course_module_progress;
CREATE POLICY "Utilisateur gère sa progression cours"
  ON public.course_module_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
