-- Cercles de soutien — catalogue anglais (après supabase_confessional_support_groups.sql)

INSERT INTO public.confessional_support_groups (situation, title, description, language)
VALUES
  ('depression', 'Circle — Sadness & hardship', 'An anonymous space where others walk through difficult seasons, like you.', 'en'),
  ('grief', 'Circle — Grief', 'Share the path of grief without judgment.', 'en'),
  ('addiction', 'Circle — Freedom', 'Mutual support in struggle and hope.', 'en'),
  ('family', 'Circle — Family', 'When family wounds or fractures.', 'en'),
  ('spiritual', 'Circle — Doubt & faith', 'Question, seek, and not walk alone in doubt.', 'en'),
  ('other', 'Circle — Other trials', 'Any suffering that deserves to be heard.', 'en')
ON CONFLICT (situation, language) DO NOTHING;
