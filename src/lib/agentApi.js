const API_BASE = import.meta.env.VITE_API_URL || '';

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'request_failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function postAgentChat({ message, language, history, accessToken, userType }) {
  const res = await fetch(`${API_BASE}/api/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ message, language, history, userType }),
  });
  return parseResponse(res);
}

export async function postAgentPerspectives({ question, language, accessToken, userType }) {
  const res = await fetch(`${API_BASE}/api/agent/perspectives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ question, language, userType }),
  });
  return parseResponse(res);
}

export async function getAgentHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return parseResponse(res);
}
