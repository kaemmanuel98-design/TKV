-- Sécurité TKV — exécuter dans Supabase SQL Editor après les migrations existantes
-- 1) Empêcher la modification du contenu des posts (réactions uniquement)
-- 2) Usage IA : lecture seule côté client (écriture via service role API)

CREATE OR REPLACE FUNCTION public.community_posts_guard_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.content IS DISTINCT FROM OLD.content
    OR NEW.post_type IS DISTINCT FROM OLD.post_type
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'community_update_forbidden'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_posts_guard_update ON public.community_posts;
CREATE TRIGGER community_posts_guard_update
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.community_posts_guard_sensitive_columns();

DROP POLICY IF EXISTS "Utilisateur met à jour son usage IA" ON public.ia_daily_usage;
