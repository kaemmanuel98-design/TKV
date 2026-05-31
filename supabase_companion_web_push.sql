-- Notifications Web Push accompagnateurs — après supabase_companion_dashboard.sql

CREATE TABLE IF NOT EXISTS public.companion_push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS companion_push_subscriptions_user_idx
  ON public.companion_push_subscriptions (user_id);

ALTER TABLE public.companion_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companion_push_select_own"
  ON public.companion_push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "companion_push_insert_own"
  ON public.companion_push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companion_push_update_own"
  ON public.companion_push_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companion_push_delete_own"
  ON public.companion_push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.companion_push_subscriptions IS 'Abonnements Web Push pour alertes crise Confessionnal (accompagnateurs).';
