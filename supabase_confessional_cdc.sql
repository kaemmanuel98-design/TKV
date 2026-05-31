-- Confessionnal CdC v3 addendum (avril 2026) — exécuter après supabase_confessional.sql

ALTER TABLE public.confession_sessions
  ADD COLUMN IF NOT EXISTS session_type text DEFAULT 'support',
  ADD COLUMN IF NOT EXISTS situation text,
  ADD COLUMN IF NOT EXISTS crisis_level text DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS keywords_detected text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS country_detected text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.confession_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.confession_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'ai', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS confession_messages_session_idx
  ON public.confession_messages (session_id, created_at);

CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prayer_text text NOT NULL,
  is_anonymous boolean DEFAULT true NOT NULL,
  prayer_count integer DEFAULT 0 NOT NULL,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'closed')),
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS prayer_requests_active_idx
  ON public.prayer_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.companion_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.confession_sessions(id) ON DELETE SET NULL,
  first_name text,
  availability text,
  message text,
  situation text,
  urgency boolean DEFAULT false NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.confession_crisis_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.confession_sessions(id) ON DELETE SET NULL,
  crisis_level text NOT NULL,
  keywords_detected text[] DEFAULT '{}',
  country_detected text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.confession_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_crisis_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "confession_messages_select_own"
  ON public.confession_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "confession_messages_insert_own"
  ON public.confession_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prayer_requests_select_active"
  ON public.prayer_requests FOR SELECT TO authenticated
  USING (status = 'active');

CREATE POLICY "prayer_requests_insert_own"
  ON public.prayer_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prayer_requests_update_count"
  ON public.prayer_requests FOR UPDATE TO authenticated
  USING (status = 'active')
  WITH CHECK (status = 'active');

CREATE POLICY "prayer_requests_select_own"
  ON public.prayer_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "companion_requests_insert_own"
  ON public.companion_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companion_requests_select_own"
  ON public.companion_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "crisis_events_insert_own"
  ON public.confession_crisis_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "crisis_events_select_own"
  ON public.confession_crisis_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.confession_messages IS 'Messages Confessionnal — visibles uniquement par leur auteur.';
COMMENT ON TABLE public.prayer_requests IS 'Demandes de prière anonymes (cercle de prière).';
COMMENT ON TABLE public.companion_requests IS 'Demandes de contact accompagnateur (sans contenu du chat).';
