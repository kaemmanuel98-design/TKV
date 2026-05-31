-- Candidatures accompagnateur Confessionnal — après supabase_companion_dashboard.sql

CREATE TABLE IF NOT EXISTS public.companion_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  motivation text NOT NULL,
  experience text,
  church_affiliation text,
  charter_accepted boolean DEFAULT false NOT NULL,
  status text DEFAULT 'pending' NOT NULL
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS companion_applications_status_idx
  ON public.companion_applications (status, created_at DESC);

ALTER TABLE public.companion_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companion_apply_select_own"
  ON public.companion_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "companion_apply_insert_own"
  ON public.companion_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND charter_accepted = true);

COMMENT ON TABLE public.companion_applications IS 'Candidatures pour devenir accompagnateur spirituel TKV.';
