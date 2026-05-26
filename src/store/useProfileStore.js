import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PROFILE_TYPE_KEY, ONBOARDING_KEY } from './useGamificationStore';

export const useProfileStore = create((set, get) => ({
  profile: null,
  loading: false,

  fetchProfile: async (userId) => {
    if (!userId) {
      set({ profile: null });
      return null;
    }
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        set({ profile: data });
        if (data.user_type) localStorage.setItem(PROFILE_TYPE_KEY, data.user_type);
        if (data.onboarding_completed) localStorage.setItem(ONBOARDING_KEY, 'true');
        return data;
      }

      const fallback = {
        user_type: localStorage.getItem(PROFILE_TYPE_KEY) || 'curious',
        plan_type: 'free',
        is_premium: false,
        onboarding_completed: localStorage.getItem(ONBOARDING_KEY) === 'true',
      };
      set({ profile: fallback });
      return fallback;
    } catch {
      const fallback = {
        user_type: localStorage.getItem(PROFILE_TYPE_KEY) || 'curious',
        plan_type: 'free',
        is_premium: false,
        onboarding_completed: localStorage.getItem(ONBOARDING_KEY) === 'true',
      };
      set({ profile: fallback });
      return fallback;
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (userId, updates) => {
    if (!userId) {
      if (updates.user_type) localStorage.setItem(PROFILE_TYPE_KEY, updates.user_type);
      if (updates.onboarding_completed) localStorage.setItem(ONBOARDING_KEY, 'true');
      set({ profile: { ...get().profile, ...updates } });
      return { ...get().profile, ...updates };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (!error && data) {
      set({ profile: data });
      return data;
    }

    set({ profile: { ...get().profile, ...updates } });
    return get().profile;
  },

  getPlanType: () => {
    const p = get().profile;
    if (p?.is_premium) return p.plan_type === 'premium_plus' ? 'premium_plus' : 'premium';
    return p?.plan_type || 'free';
  },

  isPremium: () => {
    const plan = get().getPlanType();
    return plan === 'premium' || plan === 'premium_plus';
  },
}));
