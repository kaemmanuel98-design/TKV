-- Permettre à l'auteur de supprimer sa publication
-- Exécuter dans Supabase SQL Editor

CREATE POLICY "Auteur peut supprimer son post"
  ON public.community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
