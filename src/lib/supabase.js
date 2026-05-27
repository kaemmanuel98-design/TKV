import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const PLACEHOLDER_HOST = 'placeholder.supabase.co';

export function isSupabaseConfigured() {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes(PLACEHOLDER_HOST) || supabaseUrl.includes('your-project')) return false;
  if (supabaseAnonKey === 'placeholder-anon-key' || supabaseAnonKey.includes('your-anon-key')) {
    return false;
  }
  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== 'https:') return false;
    if (!parsed.hostname.endsWith('.supabase.co')) return false;
  } catch {
    return false;
  }
  return true;
}

/** Vérifie que l’API Auth Supabase répond (diagnostic page /auth). */
export async function pingSupabaseAuth() {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'not_configured' };
  try {
    const base = supabaseUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: supabaseAnonKey },
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export const supabase = createClient(
  supabaseUrl || `https://${PLACEHOLDER_HOST}`,
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
