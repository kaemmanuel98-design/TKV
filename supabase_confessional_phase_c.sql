-- Confessionnal Phase C — quota dédié (exécuter après supabase_confessional_cdc.sql)

ALTER TABLE public.ia_daily_usage
  ADD COLUMN IF NOT EXISTS confessional_count integer DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.ia_daily_usage.confessional_count IS
  'Messages Confessionnal du jour (quota séparé de l''agent IA).';
