# Paiements Premium — PayPal (actif)

Pour l’instant, seul **PayPal** est proposé dans l’app. Le code Wave reste dans le dépôt pour une activation ultérieure.

## Configuration `.env`

```env
APP_PUBLIC_URL=https://tkv-app.vercel.app

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_SANDBOX=true

PREMIUM_AMOUNT_EUR_CENTS=999
PREMIUM_PLUS_AMOUNT_EUR_CENTS=1499
PREMIUM_DURATION_DAYS=30

# Tests locaux sans compte PayPal réel
PAYMENT_SANDBOX=true
PAYMENT_DEV_SECRET=dev-only-secret
```

Sandbox : [developer.paypal.com](https://developer.paypal.com)

## Flux

1. Paywall → choix du plan → **Payer avec PayPal**
2. Redirection PayPal
3. Retour `/payment/return` → capture → Premium activé

## Vercel

| Variable | Valeur |
|----------|--------|
| `PAYPAL_CLIENT_ID` | Client ID |
| `PAYPAL_CLIENT_SECRET` | Secret |
| `PAYPAL_SANDBOX` | `false` en production réelle |
| `APP_PUBLIC_URL` | `https://tkv-app.vercel.app` |

Redéployer après modification des variables (`VITE_*` et secrets serveur).

## SQL Supabase

`supabase_certificates_payments.sql`

Si la contrainte autorise encore `wave` :

```sql
-- supabase_payments_paypal_only.sql
ALTER TABLE public.subscription_orders
  DROP CONSTRAINT IF EXISTS subscription_orders_payment_method_check;
ALTER TABLE public.subscription_orders
  ADD CONSTRAINT subscription_orders_payment_method_check
  CHECK (payment_method IN ('paypal'));
```

## Dépannage

| Symptôme | Action |
|----------|--------|
| `request_failed` | `npm run dev:api` + `npm run dev` |
| Pas de redirection PayPal | Vérifier `PAYPAL_CLIENT_ID` / `SECRET`, redémarrer l’API |
| Premium non activé | Vérifier logs API au retour PayPal ; `APP_PUBLIC_URL` correct |

Secours admin : `node scripts/mark-order-paid.mjs TKV-XXXXXXXX`

## Wave (plus tard)

Variables commentées dans `.env.example` — réactiver l’UI et l’API quand vous serez prêt.
