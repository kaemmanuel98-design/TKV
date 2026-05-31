-- Dashboard accompagnateur Confessionnal — exécuter après supabase_confessional_cdc.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_confessional_companion boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS companion_availability text DEFAULT 'offline'
    CHECK (companion_availability IN ('online', 'busy', 'offline'));

ALTER TABLE public.companion_requests
  ADD COLUMN IF NOT EXISTS assigned_companion_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

DO $$
BEGIN
  ALTER TABLE public.companion_requests
    DROP CONSTRAINT IF EXISTS companion_requests_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.companion_requests
  ALTER COLUMN status SET DEFAULT 'pending';

UPDATE public.companion_requests SET status = 'pending' WHERE status IS NULL OR status = '';

CREATE TABLE IF NOT EXISTS public.companion_case_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.companion_requests(id) ON DELETE CASCADE NOT NULL,
  companion_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_text text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS companion_case_notes_request_idx
  ON public.companion_case_notes (request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.companion_chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.companion_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('user', 'companion')),
  content text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS companion_chat_messages_request_idx
  ON public.companion_chat_messages (request_id, created_at);

-- Messages Confessionnal : contenu chiffré (préfixe enc:v1:… géré par l'API)
COMMENT ON COLUMN public.confession_messages.content IS
  'Texte clair (legacy) ou blob enc:v1:iv:tag:ciphertext (AES-256-GCM).';

ALTER TABLE public.companion_case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_chat_messages ENABLE ROW LEVEL SECURITY;

-- Notes : uniquement l'auteur accompagnateur
CREATE POLICY "companion_notes_select_own"
  ON public.companion_case_notes FOR SELECT TO authenticated
  USING (auth.uid() = companion_id);

CREATE POLICY "companion_notes_insert_own"
  ON public.companion_case_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = companion_id);

-- Chat accompagnateur : lecture si demande assignée ou demandeur
CREATE POLICY "companion_chat_select_participant"
  ON public.companion_chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companion_requests r
      WHERE r.id = request_id
        AND (r.user_id = auth.uid() OR r.assigned_companion_id = auth.uid())
    )
  );

CREATE POLICY "companion_chat_insert_participant"
  ON public.companion_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.companion_requests r
      WHERE r.id = request_id
        AND r.status IN ('assigned', 'in_progress')
        AND (r.user_id = auth.uid() OR r.assigned_companion_id = auth.uid())
    )
  );

COMMENT ON TABLE public.companion_case_notes IS 'Notes privées accompagnateur (non visibles par l''utilisateur).';
COMMENT ON TABLE public.companion_chat_messages IS 'Chat privé utilisateur ↔ accompagnateur (contenu chiffré côté API).';
