-- TKV Cahier des Charges v3.0 — Extension schéma (Phase 1a)
-- Exécuter dans Supabase SQL Editor après supabase_init.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'curious'
    CHECK (user_type IN ('believer', 'skeptic', 'curious')),
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS streak_current integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_best integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free'
    CHECK (plan_type IN ('free', 'premium', 'premium_plus')),
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Mise à jour du trigger inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, user_type, plan_type, onboarding_completed)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'user_type', 'curious'),
    'free',
    COALESCE((new.raw_user_meta_data->>'onboarding_completed')::boolean, false)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fil communautaire (v1.0)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  reactions_count integer DEFAULT 0
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts lisibles par tous"
  ON public.community_posts FOR SELECT USING (true);

CREATE POLICY "Utilisateurs authentifiés peuvent publier"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usage quotidien agent IA (CdC §3.5)
CREATE TABLE IF NOT EXISTS public.ia_daily_usage (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  requests_count integer DEFAULT 0,
  perspectives_count integer DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.ia_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur lit son usage IA"
  ON public.ia_daily_usage FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur met à jour son usage IA"
  ON public.ia_daily_usage FOR ALL USING (auth.uid() = user_id);

-- Extension pgvector (Phase 1b — à activer quand prêt)
-- CREATE EXTENSION IF NOT EXISTS vector;
-- Voir knowledge_chunks dans le CdC §4.2
