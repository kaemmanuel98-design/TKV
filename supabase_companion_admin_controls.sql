-- Companion admin controls: post moderation + admin audit logs
-- Run in Supabase SQL editor after existing community/confessional migrations.

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_note text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_companion_moderator boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_companion_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_companion_super_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.guard_last_super_admin_profile()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_super_count integer;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_companion_super_admin = true AND NEW.is_companion_super_admin = false THEN
      SELECT count(*)::integer INTO v_super_count
      FROM public.profiles
      WHERE is_companion_super_admin = true
        AND id <> OLD.id;
      IF v_super_count < 1 THEN
        RAISE EXCEPTION 'last_super_admin_forbidden'
          USING ERRCODE = '42501';
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_companion_super_admin = true THEN
      SELECT count(*)::integer INTO v_super_count
      FROM public.profiles
      WHERE is_companion_super_admin = true
        AND id <> OLD.id;
      IF v_super_count < 1 THEN
        RAISE EXCEPTION 'last_super_admin_forbidden'
          USING ERRCODE = '42501';
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_last_super_admin_update ON public.profiles;
CREATE TRIGGER trg_profiles_guard_last_super_admin_update
BEFORE UPDATE OF is_companion_super_admin ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_last_super_admin_profile();

DROP TRIGGER IF EXISTS trg_profiles_guard_last_super_admin_delete ON public.profiles;
CREATE TRIGGER trg_profiles_guard_last_super_admin_delete
BEFORE DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_last_super_admin_profile();

CREATE INDEX IF NOT EXISTS community_posts_moderation_status_idx
  ON public.community_posts (moderation_status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.companion_admin_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.companion_role_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invitee_email text NOT NULL,
  invited_role text NOT NULL CHECK (invited_role IN ('companion', 'moderator', 'admin', 'superadmin')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
  accepted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS companion_role_invites_email_status_idx
  ON public.companion_role_invites (invitee_email, status, created_at DESC);

CREATE INDEX IF NOT EXISTS companion_admin_audit_created_idx
  ON public.companion_admin_audit_logs (created_at DESC);

ALTER TABLE public.companion_admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companion_admin_audit_no_client_select" ON public.companion_admin_audit_logs;
CREATE POLICY "companion_admin_audit_no_client_select"
  ON public.companion_admin_audit_logs FOR SELECT
  USING (false);

DROP POLICY IF EXISTS "companion_admin_audit_no_client_insert" ON public.companion_admin_audit_logs;
CREATE POLICY "companion_admin_audit_no_client_insert"
  ON public.companion_admin_audit_logs FOR INSERT
  WITH CHECK (false);
