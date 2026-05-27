-- Anti-spam serveur pour community_posts
-- Exécuter dans Supabase SQL Editor (après supabase_community_patch.sql)

CREATE OR REPLACE FUNCTION public.enforce_community_post_antispam()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_created_at timestamptz;
  v_remaining_seconds integer;
  v_duplicate_exists boolean;
BEGIN
  -- Minimum de contenu utile
  IF char_length(btrim(COALESCE(NEW.content, ''))) < 8 THEN
    RAISE EXCEPTION USING
      MESSAGE = 'community_min_length',
      ERRCODE = 'P0001';
  END IF;

  -- Cooldown anti-flood
  SELECT cp.created_at
  INTO v_last_created_at
  FROM public.community_posts cp
  WHERE cp.user_id = NEW.user_id
  ORDER BY cp.created_at DESC
  LIMIT 1;

  IF v_last_created_at IS NOT NULL AND (now() - v_last_created_at) < interval '30 seconds' THEN
    v_remaining_seconds := CEIL(EXTRACT(EPOCH FROM (interval '30 seconds' - (now() - v_last_created_at))))::integer;
    RAISE EXCEPTION USING
      MESSAGE = 'community_cooldown',
      DETAIL = GREATEST(v_remaining_seconds, 1)::text,
      ERRCODE = 'P0001';
  END IF;

  -- Blocage des doublons récents (12h)
  SELECT EXISTS (
    SELECT 1
    FROM public.community_posts cp
    WHERE cp.user_id = NEW.user_id
      AND cp.created_at >= (now() - interval '12 hours')
      AND lower(regexp_replace(btrim(cp.content), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(NEW.content), '\s+', ' ', 'g'))
  )
  INTO v_duplicate_exists;

  IF v_duplicate_exists THEN
    RAISE EXCEPTION USING
      MESSAGE = 'community_duplicate',
      ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_posts_antispam ON public.community_posts;
CREATE TRIGGER trg_community_posts_antispam
BEFORE INSERT ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_community_post_antispam();
