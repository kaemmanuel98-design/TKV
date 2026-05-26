import { supabase } from './supabase';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateAvatarFile(file) {
  if (!file) return 'profile_avatar_error_empty';
  if (!ALLOWED.includes(file.type)) return 'profile_avatar_error_type';
  if (file.size > MAX_BYTES) return 'profile_avatar_error_size';
  return null;
}

export async function uploadAvatarFile(userId, file) {
  const errKey = validateAvatarFile(file);
  if (errKey) {
    throw Object.assign(new Error(errKey), { i18nKey: errKey });
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/gif' ? 'gif' : 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;
  return url;
}
