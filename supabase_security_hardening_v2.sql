-- TKV — durcissement sécurité v2 (exécuter dans Supabase SQL Editor)
-- Bloque l'escalade de privilèges profil, sécurise les invites admin,
-- les certificats, le compteur de prières et l'usage IA côté client.

-- ---------------------------------------------------------------------------
-- 1) Profils : empêcher l'auto-attribution Premium / accompagnateur / admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
    OR NEW.plan_type IS DISTINCT FROM OLD.plan_type
    OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
    OR NEW.can_host_visio IS DISTINCT FROM OLD.can_host_visio
    OR NEW.is_confessional_companion IS DISTINCT FROM OLD.is_confessional_companion
    OR NEW.is_companion_admin IS DISTINCT FROM OLD.is_companion_admin
    OR NEW.is_companion_super_admin IS DISTINCT FROM OLD.is_companion_super_admin
  THEN
    RAISE EXCEPTION 'profile_privilege_update_forbidden'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_privileged_columns ON public.profiles;
CREATE TRIGGER trg_profiles_guard_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_privileged_columns();

-- ---------------------------------------------------------------------------
-- 2) Invites rôles accompagnateur : aucun accès client direct
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.companion_role_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companion_role_invites_no_client_select" ON public.companion_role_invites;
CREATE POLICY "companion_role_invites_no_client_select"
  ON public.companion_role_invites FOR SELECT
  USING (false);

DROP POLICY IF EXISTS "companion_role_invites_no_client_insert" ON public.companion_role_invites;
CREATE POLICY "companion_role_invites_no_client_insert"
  ON public.companion_role_invites FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "companion_role_invites_no_client_update" ON public.companion_role_invites;
CREATE POLICY "companion_role_invites_no_client_update"
  ON public.companion_role_invites FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "companion_role_invites_no_client_delete" ON public.companion_role_invites;
CREATE POLICY "companion_role_invites_no_client_delete"
  ON public.companion_role_invites FOR DELETE
  USING (false);

-- ---------------------------------------------------------------------------
-- 3) Certificats : lecture seule côté client (insertion via service role)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Utilisateur crée ses certificats" ON public.course_certificates;

-- ---------------------------------------------------------------------------
-- 4) Compteur de prières : incrément +1 uniquement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prayer_requests_guard_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.prayer_text IS DISTINCT FROM OLD.prayer_text
    OR NEW.is_anonymous IS DISTINCT FROM OLD.is_anonymous
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'prayer_update_forbidden'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.prayer_count IS DISTINCT FROM OLD.prayer_count + 1 THEN
    RAISE EXCEPTION 'prayer_count_increment_only'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prayer_requests_guard_update ON public.prayer_requests;
CREATE TRIGGER trg_prayer_requests_guard_update
  BEFORE UPDATE ON public.prayer_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prayer_requests_guard_update();

-- ---------------------------------------------------------------------------
-- 5) Usage IA : pas d'écriture client (complète supabase_security_patch.sql)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Utilisateur met à jour son usage IA" ON public.ia_daily_usage;

DROP POLICY IF EXISTS "ia_daily_usage_no_client_write" ON public.ia_daily_usage;
CREATE POLICY "ia_daily_usage_no_client_insert"
  ON public.ia_daily_usage FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "ia_daily_usage_no_client_update" ON public.ia_daily_usage;
CREATE POLICY "ia_daily_usage_no_client_update"
  ON public.ia_daily_usage FOR UPDATE
  USING (false);

-- ---------------------------------------------------------------------------
-- 6) Webhooks paiement — idempotence (service role uniquement)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id text PRIMARY KEY,
  provider text NOT NULL,
  processed_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_webhook_events_no_client" ON public.payment_webhook_events;
CREATE POLICY "payment_webhook_events_no_client"
  ON public.payment_webhook_events FOR ALL
  USING (false);
