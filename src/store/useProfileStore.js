import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { uploadAvatarFile } from '../lib/uploadAvatar';
import { canCreateCellFromProfile } from '../lib/cellHost';
import {
  getProfileLocationCache,
  locationNeedsDbSync,
  mergeProfileLocation,
  pickLocationFields,
  saveProfileLocationCache,
} from '../lib/profileLocation';
import { enrichProfileWithFounderAccess } from '../lib/founderAccess';
import { PROFILE_TYPE_KEY, ONBOARDING_KEY } from './useGamificationStore';

async function persistProfileUpdate(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (!error) return { data, error: null };

  const hasCity = Object.prototype.hasOwnProperty.call(updates, 'city');
  const hasMapOptIn = Object.prototype.hasOwnProperty.call(updates, 'show_on_map');
  const hasMapCoords =
    Object.prototype.hasOwnProperty.call(updates, 'map_address') ||
    Object.prototype.hasOwnProperty.call(updates, 'latitude') ||
    Object.prototype.hasOwnProperty.call(updates, 'longitude');
  if (!hasCity && !hasMapOptIn && !hasMapCoords) return { data: null, error };

  const fallback = { ...updates };
  delete fallback.city;
  delete fallback.show_on_map;
  delete fallback.map_address;
  delete fallback.latitude;
  delete fallback.longitude;

  if (!Object.keys(fallback).length) return { data: null, error };

  const retry = await supabase.from('profiles').update(fallback).eq('id', userId).select().maybeSingle();
  return { data: retry.data, error: retry.error || error };
}

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
      const { data: authData } = await supabase.auth.getUser();
      const userEmail = authData?.user?.email || '';

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        let merged = enrichProfileWithFounderAccess(
          mergeProfileLocation(data, userId),
          userEmail
        );
        const cache = getProfileLocationCache(userId);
        if (cache && locationNeedsDbSync(merged, userId)) {
          const { data: synced } = await persistProfileUpdate(userId, pickLocationFields(cache));
          if (synced) {
            merged = enrichProfileWithFounderAccess(
              mergeProfileLocation(synced, userId),
              userEmail
            );
          }
        }
        set({ profile: merged });
        if (merged.user_type) localStorage.setItem(PROFILE_TYPE_KEY, merged.user_type);
        if (merged.onboarding_completed) localStorage.setItem(ONBOARDING_KEY, 'true');
        return merged;
      }

      const cached = getProfileLocationCache(userId);
      const fallback = enrichProfileWithFounderAccess(
        {
          user_type: localStorage.getItem(PROFILE_TYPE_KEY) || 'curious',
          plan_type: 'free',
          is_premium: false,
          onboarding_completed: localStorage.getItem(ONBOARDING_KEY) === 'true',
          country: cached?.country || '',
          city: cached?.city || '',
          map_address: cached?.map_address || '',
          latitude: cached?.latitude ?? null,
          longitude: cached?.longitude ?? null,
          show_on_map: cached?.show_on_map ?? false,
        },
        userEmail
      );
      set({ profile: fallback });
      return fallback;
    } catch {
      const cached = getProfileLocationCache(userId);
      let userEmail = '';
      try {
        const { data: authData } = await supabase.auth.getUser();
        userEmail = authData?.user?.email || '';
      } catch {
        /* ignore */
      }
      const fallback = enrichProfileWithFounderAccess(
        {
          user_type: localStorage.getItem(PROFILE_TYPE_KEY) || 'curious',
          plan_type: 'free',
          is_premium: false,
          onboarding_completed: localStorage.getItem(ONBOARDING_KEY) === 'true',
          country: cached?.country || '',
          city: cached?.city || '',
          map_address: cached?.map_address || '',
          latitude: cached?.latitude ?? null,
          longitude: cached?.longitude ?? null,
          show_on_map: cached?.show_on_map ?? false,
        },
        userEmail
      );
      set({ profile: fallback });
      return fallback;
    } finally {
      set({ loading: false });
    }
  },

  uploadAvatar: async (userId, file) => {
    const avatar_url = await uploadAvatarFile(userId, file);
    return get().updateProfile(userId, { avatar_url });
  },

  updateProfile: async (userId, updates) => {
    const locationPatch = pickLocationFields(updates);
    if (userId && Object.keys(locationPatch).length) {
      saveProfileLocationCache(userId, locationPatch);
    }

    if (!userId) {
      if (updates.user_type) localStorage.setItem(PROFILE_TYPE_KEY, updates.user_type);
      if (updates.onboarding_completed) localStorage.setItem(ONBOARDING_KEY, 'true');
      set({ profile: { ...get().profile, ...updates } });
      return { ...get().profile, ...updates };
    }

    const { data, error } = await persistProfileUpdate(userId, updates);

    if (data) {
      const merged = mergeProfileLocation(data, userId);
      set({ profile: merged });
      return merged;
    }

    const merged = mergeProfileLocation({ ...get().profile, ...updates }, userId);
    set({ profile: merged });
    if (error && Object.keys(locationPatch).length) {
      console.warn('[TKV] Profil partiellement en cache local (migration Supabase city/show_on_map ?)', error.message);
    }
    return merged;
  },

  getPlanType: () => {
    const p = get().profile;
    if (p?.is_premium || p?.plan_type === 'premium' || p?.plan_type === 'premium_plus') {
      return 'premium';
    }
    return p?.plan_type || 'free';
  },

  isPremium: () => get().getPlanType() === 'premium',

  /** @deprecated alias — Premium inclut tous les anciens privilèges Premium+ */
  isPremiumPlus: () => get().isPremium(),

  /** Créer une cellule (Premium ou animateur sur le profil). */
  canCreateCell: () => canCreateCellFromProfile(get().profile),

  /** @deprecated alias — utiliser canCreateCell */
  canHostVisio: () => canCreateCellFromProfile(get().profile),
}));
