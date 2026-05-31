import { supabase } from './supabase';

export async function searchMembers(query, myUserId, limit = 20) {
  const q = query.trim();
  if (q.length < 2) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .neq('id', myUserId)
    .ilike('name', `%${q}%`)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchMyFriendRequests(userId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, from_user_id, to_user_id, status, created_at')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function enrichWithProfiles(rows, t) {
  if (!rows?.length) return [];
  const ids = [...new Set(rows.flatMap((r) => [r.from_user_id, r.to_user_id]))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, last_seen_at')
    .in('id', ids);

  const byId = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return rows.map((row) => {
    const otherId = row.from_user_id === row.viewerId ? row.to_user_id : row.from_user_id;
    const prof = byId[otherId];
    return {
      ...row,
      otherId,
      otherName: prof?.name || t('community_author_anonymous'),
      otherAvatar: prof?.avatar_url || null,
      otherLastSeen: prof?.last_seen_at || null,
    };
  });
}

export function splitFriendData(requests, userId) {
  const incoming = [];
  const outgoing = [];
  const friends = [];

  for (const r of requests) {
    const withViewer = { ...r, viewerId: userId };
    if (r.status === 'accepted') {
      friends.push(withViewer);
    } else if (r.status === 'pending') {
      if (r.to_user_id === userId) incoming.push(withViewer);
      else outgoing.push(withViewer);
    }
  }

  return { incoming, outgoing, friends };
}

export async function sendFriendRequest(fromUserId, toUserId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({ from_user_id: fromUserId, to_user_id: toUserId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function respondFriendRequest(requestId, status) {
  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelFriendRequest(requestId) {
  const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
  if (error) throw error;
}

export function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
}

export async function fetchAcceptedFriends(userId, t) {
  const rows = await fetchMyFriendRequests(userId);
  const { friends } = splitFriendData(rows, userId);
  return enrichWithProfiles(friends, t);
}

/** Amis acceptés avec pays renseigné (carte). */
export async function loadFriendMapMembers(userId, t) {
  const friendIds = (await fetchMyFriendRequests(userId))
    .filter((r) => r.status === 'accepted')
    .map((r) => (r.from_user_id === userId ? r.to_user_id : r.from_user_id));

  if (!friendIds.length) return [];

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, country, city, bio, avatar_url, last_seen_at, map_address, latitude, longitude')
    .in('id', friendIds);

  if (error) {
    const fallback = await supabase
      .from('profiles')
      .select('id, name, country, city, bio, avatar_url, last_seen_at')
      .in('id', friendIds)
      .not('country', 'is', null);
    if (fallback.error) throw fallback.error;
    return (fallback.data || []).map((p) => ({
      id: p.id,
      name: p.name || t('community_author_anonymous'),
      country: p.country,
      city: p.city,
      bio: p.bio,
      avatarUrl: p.avatar_url,
      lastSeenAt: p.last_seen_at,
      isFriend: true,
    }));
  }

  return (profiles || [])
    .filter((p) => p.country?.trim() || (p.latitude != null && p.longitude != null))
    .map((p) => ({
      id: p.id,
      name: p.name || t('community_author_anonymous'),
      country: p.country,
      city: p.city,
      bio: p.bio,
      avatarUrl: p.avatar_url,
      map_address: p.map_address,
      latitude: p.latitude,
      longitude: p.longitude,
      lastSeenAt: p.last_seen_at,
      isFriend: true,
    }));
}

export function relationWith(requests, myId, otherId) {
  const row = requests.find(
    (r) =>
      (r.from_user_id === myId && r.to_user_id === otherId) ||
      (r.from_user_id === otherId && r.to_user_id === myId)
  );
  if (!row) return 'none';
  if (row.status === 'accepted') return 'friends';
  if (row.status === 'pending') {
    return row.from_user_id === myId ? 'pending_out' : 'pending_in';
  }
  return 'rejected';
}
