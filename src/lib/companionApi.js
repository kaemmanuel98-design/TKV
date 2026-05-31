import { API_BASE, parseApiResponse } from './apiClient.js';

function authHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchCompanionMe(accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function fetchCompanionQueue(accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/queue`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function fetchCompanionCrises(accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/crises`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function fetchCompanionRequest(id, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/requests/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function assignCompanionRequest(id, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/requests/${id}/assign`, {
    method: 'POST',
    headers: authHeaders(accessToken),
  });
  return parseApiResponse(res);
}

export async function patchCompanionRequestStatus(id, status, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/requests/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ status }),
  });
  return parseApiResponse(res);
}

export async function postCompanionNote(id, noteText, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/requests/${id}/notes`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ noteText }),
  });
  return parseApiResponse(res);
}

export async function postCompanionEmergency(id, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/requests/${id}/emergency`, {
    method: 'POST',
    headers: authHeaders(accessToken),
  });
  return parseApiResponse(res);
}

export async function fetchCompanionChatMessages(requestId, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/requests/${requestId}/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function sendCompanionChatMessage(requestId, message, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/requests/${requestId}/messages`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ message }),
  });
  return parseApiResponse(res);
}

export async function patchCompanionAvailability(availability, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/availability`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ availability }),
  });
  return parseApiResponse(res);
}

export async function fetchUserCompanionChat(requestId, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/companion-chat/${requestId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function fetchCompanionTeam(accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/team`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function transferCompanionRequest(requestId, toCompanionId, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/requests/${requestId}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ toCompanionId }),
  });
  return parseApiResponse(res);
}

export async function sendUserCompanionChat(requestId, message, accessToken) {
  const res = await fetch(`${API_BASE}/api/confessional/companion-chat/${requestId}`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ message }),
  });
  return parseApiResponse(res);
}
