-- Chat privé entre amis (après supabase_friends.sql)

CREATE OR REPLACE FUNCTION public.are_friends(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friend_requests fr
    WHERE fr.status = 'accepted'
      AND (
        (fr.from_user_id = user_a AND fr.to_user_id = user_b)
        OR (fr.from_user_id = user_b AND fr.to_user_id = user_a)
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.are_friends(uuid, uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.friend_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (char_length(btrim(content)) >= 1),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS friend_messages_pair_idx
  ON public.friend_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS friend_messages_recipient_idx
  ON public.friend_messages (recipient_id, created_at DESC);

ALTER TABLE public.friend_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friend_messages_select_participants"
  ON public.friend_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "friend_messages_insert_friends_only"
  ON public.friend_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.are_friends(sender_id, recipient_id)
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_messages;

-- Notifications uniquement in-app (désactiver e-mail par défaut)
ALTER TABLE public.profiles
  ALTER COLUMN notify_friend_online_email SET DEFAULT false;

UPDATE public.profiles
SET notify_friend_online_email = false
WHERE notify_friend_online_email IS DISTINCT FROM false;
