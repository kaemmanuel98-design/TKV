import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ensureProfile } from '../lib/ensureProfile';
import { isSignupExistingUser } from '../lib/authErrors';

function authRedirectTo() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/auth?confirmed=1`;
}

function applySession(set, session) {
  set({ session, user: session?.user ?? null });
}

let authListenerBound = false;

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    applySession(set, session);
    set({ loading: false });

    if (!authListenerBound) {
      authListenerBound = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        applySession(set, session);
      });
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw Object.assign(new Error('Supabase not configured'), { code: 'supabase_not_configured' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    applySession(set, data.session);
    if (data.user) await ensureProfile(data.user);
    return data;
  },

  signUp: async (email, password, metadata = {}) => {
    if (!isSupabaseConfigured()) {
      throw Object.assign(new Error('Supabase not configured'), { code: 'supabase_not_configured' });
    }

    const userType =
      metadata.user_type || localStorage.getItem('tkv_profile_type') || 'curious';

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: authRedirectTo(),
        data: {
          ...metadata,
          user_type: userType,
        },
      },
    });
    if (error) throw error;

    const alreadyExists = isSignupExistingUser(data.user);

    if (data.session) {
      applySession(set, data.session);
      if (data.user) await ensureProfile(data.user);
    }

    const needsEmailConfirmation = Boolean(data.user && !data.session) || alreadyExists;

    return {
      ...data,
      needsEmailConfirmation,
      alreadyExists,
    };
  },

  resetPassword: async (email) => {
    if (!isSupabaseConfigured()) {
      throw Object.assign(new Error('Supabase not configured'), { code: 'supabase_not_configured' });
    }
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth?reset=1` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) throw error;
  },

  updatePassword: async (newPassword) => {
    if (!isSupabaseConfigured()) {
      throw Object.assign(new Error('Supabase not configured'), { code: 'supabase_not_configured' });
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  resendSignupEmail: async (email) => {
    if (!isSupabaseConfigured()) {
      throw Object.assign(new Error('Supabase not configured'), { code: 'supabase_not_configured' });
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: authRedirectTo() },
    });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    applySession(set, null);
  },
}));
