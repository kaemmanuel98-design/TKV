const API_BASE = import.meta.env.VITE_API_URL || '';

export async function pingFriendPresence(accessToken) {
  const res = await fetch(`${API_BASE}/api/friends/presence`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'presence_failed');
  }
  return res.json();
}
