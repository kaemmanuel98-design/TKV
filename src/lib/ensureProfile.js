import { supabase } from './supabase';

/** Crée le profil public si le trigger Supabase n’a pas encore tourné. */
export async function ensureProfile(user) {
  if (!user?.id) return;

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existing?.id) return;

  const meta = user.user_metadata || {};
  await supabase.from('profiles').insert({
    id: user.id,
    name: meta.name || null,
    avatar_url: meta.avatar_url || null,
    user_type: meta.user_type || 'curious',
    plan_type: 'free',
    onboarding_completed: Boolean(meta.onboarding_completed),
  });
}
