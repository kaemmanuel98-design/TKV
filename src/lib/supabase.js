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
  return true;
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
