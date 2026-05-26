const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchJitsiJoin({ cellSlug, accessToken }) {
  const res = await fetch(`${API_BASE}/api/jitsi/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ cellSlug }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'jitsi_join_failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
