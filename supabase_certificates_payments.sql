-- Certificats parcours (CdC v1.2) + commandes Premium

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

CREATE TABLE IF NOT EXISTS public.course_certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_slug text NOT NULL,
  certificate_code text UNIQUE NOT NULL,
  holder_name text,
  issued_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (user_id, course_slug)
);

CREATE INDEX IF NOT EXISTS course_certificates_user_idx ON public.course_certificates (user_id);

ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateur lit ses certificats" ON public.course_certificates;
CREATE POLICY "Utilisateur lit ses certificats"
  ON public.course_certificates FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilisateur crée ses certificats" ON public.course_certificates;
CREATE POLICY "Utilisateur crée ses certificats"
  ON public.course_certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('premium', 'premium_plus')),
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  payment_method text NOT NULL CHECK (payment_method IN ('paypal')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_confirmation', 'paid', 'failed', 'cancelled')),
  external_id text,
  checkout_url text,
  reference_code text UNIQUE NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS subscription_orders_user_idx ON public.subscription_orders (user_id);
CREATE INDEX IF NOT EXISTS subscription_orders_reference_idx ON public.subscription_orders (reference_code);

ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateur lit ses commandes" ON public.subscription_orders;
CREATE POLICY "Utilisateur lit ses commandes"
  ON public.subscription_orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilisateur crée ses commandes" ON public.subscription_orders;
CREATE POLICY "Utilisateur crée ses commandes"
  ON public.subscription_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
