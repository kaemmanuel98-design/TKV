import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let admin = null;
let anon = null;

export function getSupabaseAdmin() {
  if (!config.supabaseUrl || !config.supabaseServiceKey) return null;
  if (!admin) {
    admin = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export function getSupabaseAnon() {
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
  if (!anon) {
    anon = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anon;
}

export async function verifyUser(token) {
  const client = getSupabaseAnon();
  if (!client || !token) return null;
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function getUserProfile(userId) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
}
