-- TKV Phase 1b — Base vectorielle pgvector (CdC §4)
-- Prérequis : activer l’extension "vector" dans Supabase Dashboard → Database → Extensions

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.contents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('book', 'course', 'podcast', 'article')),
  language text DEFAULT 'fr',
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id uuid REFERENCES public.contents(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  chunk_index integer NOT NULL,
  chunk_text text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  language text DEFAULT 'fr',
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chunks lisibles par service"
  ON public.knowledge_chunks FOR SELECT
  USING (true);

-- Recherche sémantique (seuil similarité côté app, défaut 0.75)
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.75,
  filter_language text DEFAULT 'fr'
)
RETURNS TABLE (
  id uuid,
  content_id uuid,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kc.id,
    kc.content_id,
    kc.chunk_text,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.embedding IS NOT NULL
    AND (filter_language IS NULL OR kc.language = filter_language)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Historique conversations IA (CdC §9.2)
CREATE TABLE IF NOT EXISTS public.ia_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  message text NOT NULL,
  tokens_used integer DEFAULT 0,
  tools_called jsonb,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.ia_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur lit ses conversations"
  ON public.ia_conversations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur insère ses messages"
  ON public.ia_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.perspective_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  believers_perspective text,
  skeptics_perspective text,
  synthesis text,
  chunks_used jsonb,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.perspective_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur lit ses analyses"
  ON public.perspective_analyses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur crée ses analyses"
  ON public.perspective_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
