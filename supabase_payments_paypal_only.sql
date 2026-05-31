-- Paiements : PayPal uniquement (Wave / Mobile Money retirés côté app)
-- Étape 1 : assouplir ou retirer l’ancienne contrainte
ALTER TABLE public.subscription_orders
  DROP CONSTRAINT IF EXISTS subscription_orders_payment_method_check;

-- Étape 2 : normaliser les anciennes commandes (wave, mobile_money, etc.)
UPDATE public.subscription_orders
SET
  payment_method = 'paypal',
  metadata = COALESCE(metadata, '{}'::jsonb)
    || jsonb_build_object('original_payment_method', payment_method)
WHERE payment_method IS DISTINCT FROM 'paypal';

-- Étape 3 : nouvelle contrainte (PayPal seul)
ALTER TABLE public.subscription_orders
  ADD CONSTRAINT subscription_orders_payment_method_check
  CHECK (payment_method IN ('paypal'));
