-- Patch Phase 1b — slug contents + podcasts (CdC §1d)

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS contents_slug_key ON public.contents (slug)
  WHERE slug IS NOT NULL;

-- Catalogue podcasts
CREATE TABLE IF NOT EXISTS public.podcasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  title text NOT NULL,
  description text,
  audio_url text,
  duration_seconds integer DEFAULT 0,
  language text DEFAULT 'fr',
  is_premium boolean DEFAULT false,
  episode_number integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Podcasts lisibles par tous"
  ON public.podcasts FOR SELECT USING (true);

-- Progression écoute (utilisateur connecté)
CREATE TABLE IF NOT EXISTS public.podcast_progress (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  podcast_id uuid REFERENCES public.podcasts(id) ON DELETE CASCADE,
  position_seconds integer DEFAULT 0,
  completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  PRIMARY KEY (user_id, podcast_id)
);

ALTER TABLE public.podcast_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur gère sa progression podcast"
  ON public.podcast_progress FOR ALL USING (auth.uid() = user_id);

-- Modules de cours
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_slug text NOT NULL,
  module_index integer NOT NULL,
  title text NOT NULL,
  content text,
  duration_minutes integer DEFAULT 15,
  is_free boolean DEFAULT false,
  language text DEFAULT 'fr',
  UNIQUE (course_slug, module_index, language)
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modules lisibles par tous"
  ON public.course_modules FOR SELECT USING (true);
