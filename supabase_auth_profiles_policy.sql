-- À exécuter dans Supabase SQL Editor si l’inscription échoue sur la création du profil
-- (complète supabase_init.sql — le trigger reste la voie principale)

DROP POLICY IF EXISTS "Utilisateur crée son propre profil" ON public.profiles;
CREATE POLICY "Utilisateur crée son propre profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
