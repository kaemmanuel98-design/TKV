import { API_BASE, parseApiResponse } from './apiClient.js';
import { supabase } from './supabase';

export async function postConfessionalChat({
  message,
  language,
  situation,
  sessionId,
  history,
  consent,
  accessToken,
}) {
  const res = await fetch(`${API_BASE}/api/confessional/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message, language, situation, sessionId, history, consent: true }),
  });
  return parseApiResponse(res);
}

export async function fetchConfessionalPrayers(accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/prayers`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function createConfessionalPrayer(prayerText, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/prayers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ prayerText }),
  });
  return parseApiResponse(res);
}

export async function prayForRequest(prayerId, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/prayers/${prayerId}/pray`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function requestCompanion(payload, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/companion-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  return parseApiResponse(res);
}

export async function fetchOpenConfessionalSessions(accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/sessions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function closeConfessionalSession(sessionId, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/sessions/${sessionId}/close`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function fetchUserCompanionRequests(accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/companion-requests`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function fetchSupportGroups(language, accessToken) {
  const lang = language?.split('-')[0] || 'fr';
  const res = await fetch(`${API_BASE}/api/confessional/support-groups?language=${lang}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function joinSupportGroup(groupId, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/support-groups/${groupId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function leaveSupportGroup(groupId, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/support-groups/${groupId}/join`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function fetchSupportGroupMessages(groupId, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/support-groups/${groupId}/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function sendSupportGroupMessage(groupId, text, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/support-groups/${groupId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text }),
  });
  return parseApiResponse(res);
}

export async function fetchConfessionalSessionMessages(sessionId, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/sessions/${sessionId}/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

/** Fallback prière via Supabase si l'API est indisponible. */
export async function fetchPrayersDirect() {
  const { data, error } = await supabase
    .from('prayer_requests')
    .select('id, prayer_text, prayer_count, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) throw error;
  return data || [];
}

export async function createPrayerDirect(userId, prayerText) {
  const { data, error } = await supabase
    .from('prayer_requests')
    .insert({ user_id: userId, prayer_text: prayerText.trim(), is_anonymous: true })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function incrementPrayerDirect(prayerId) {
  const { data: row } = await supabase
    .from('prayer_requests')
    .select('prayer_count')
    .eq('id', prayerId)
    .maybeSingle();
  if (!row) return null;
  const { data, error } = await supabase
    .from('prayer_requests')
    .update({ prayer_count: (row.prayer_count || 0) + 1 })
    .eq('id', prayerId)
    .select('prayer_count')
    .single();
  if (error) throw error;
  return data;
}
