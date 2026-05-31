import { API_BASE, parseApiResponse } from './apiClient.js';

export async function postAgentChat({ message, language, history, accessToken, userType }) {
  const res = await fetch(`${API_BASE}/api/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ message, language, history, userType }),
  });
  return parseApiResponse(res);
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
  return parseApiResponse(res);
}

export async function getAgentHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return parseApiResponse(res);
}
