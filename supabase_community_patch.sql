-- Réactions sur les posts communauté (Phase 1a — hors IA)
-- Exécuter dans Supabase SQL Editor si les likes échouent en 403

CREATE POLICY "Authentifiés peuvent réagir aux posts"
  ON public.community_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
