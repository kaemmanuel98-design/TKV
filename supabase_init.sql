-- SQL d'initialisation pour THE KINGDOM'S VOICE (TKV)

-- 1. Création de la table des messages pour le Chat Realtime
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    content text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Activer RLS (Row Level Security) sur les messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Règles de sécurité pour les messages (Tout le monde peut lire, les connectés peuvent écrire)
CREATE POLICY "Tout le monde peut lire les messages" 
ON public.messages FOR SELECT 
USING (true);

CREATE POLICY "Utilisateurs authentifiés peuvent insérer des messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Activer le Realtime pour la table des messages
-- (Nécessite généralement d'être aussi activé via l'interface Supabase -> Database -> Replication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 5. Création de la table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text,
    avatar_url text,
    is_premium boolean DEFAULT false,
    user_type text DEFAULT 'curious',
    country text,
    bio text,
    streak_current integer DEFAULT 0,
    streak_best integer DEFAULT 0,
    last_active_date date,
    plan_type text DEFAULT 'free',
    onboarding_completed boolean DEFAULT false
);

-- 6. Trigger pour créer automatiquement un profil lors d'une nouvelle inscription
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, user_type, plan_type)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'user_type', 'curious'),
    'free'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Règles de sécurité pour les profils
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profils publics" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);
