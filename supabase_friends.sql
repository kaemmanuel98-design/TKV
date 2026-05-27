-- Amis + présence en ligne (alertes in-app + e-mail)
-- Exécuter dans Supabase SQL Editor après supabase_migration_v3.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS notify_friend_online_email boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_friend_online_app boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);

CREATE INDEX IF NOT EXISTS friend_requests_to_status_idx
  ON public.friend_requests (to_user_id, status);
CREATE INDEX IF NOT EXISTS friend_requests_from_status_idx
  ON public.friend_requests (from_user_id, status);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friend_requests_select_own"
  ON public.friend_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "friend_requests_insert_pending"
  ON public.friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id AND status = 'pending');

CREATE POLICY "friend_requests_update_participants"
  ON public.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "friend_requests_delete_pending"
  ON public.friend_requests FOR DELETE
  TO authenticated
  USING (
    status = 'pending'
    AND (auth.uid() = from_user_id OR auth.uid() = to_user_id)
  );

-- Événements « ami en ligne » (Realtime in-app)
CREATE TABLE IF NOT EXISTS public.friend_presence_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

CREATE INDEX IF NOT EXISTS friend_presence_events_created_idx
  ON public.friend_presence_events (created_at DESC);

ALTER TABLE public.friend_presence_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friend_presence_select_friends"
  ON public.friend_presence_events FOR SELECT
  TO authenticated
  USING (
    user_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.friend_requests fr
      WHERE fr.status = 'accepted'
        AND (
          (fr.from_user_id = auth.uid() AND fr.to_user_id = friend_presence_events.user_id)
          OR (fr.to_user_id = auth.uid() AND fr.from_user_id = friend_presence_events.user_id)
        )
    )
  );

-- Journal anti-spam e-mail (écriture serveur uniquement via service role)
CREATE TABLE IF NOT EXISTS public.friend_online_email_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  online_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

CREATE INDEX IF NOT EXISTS friend_online_email_log_recipient_idx
  ON public.friend_online_email_log (recipient_id, online_user_id, sent_at DESC);

ALTER TABLE public.friend_online_email_log ENABLE ROW LEVEL SECURITY;

-- Realtime : activer aussi dans Supabase → Database → Replication si besoin
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_presence_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
