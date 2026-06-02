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

export async function fetchOwnCompanionApplication(accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/apply`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function submitCompanionApplication(payload, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/apply`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  return parseApiResponse(res);
}

export async function fetchCompanionApplications(accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/applications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function patchCompanionApplication(id, status, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/applications/${id}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ status }),
  });
  return parseApiResponse(res);
}

export async function fetchCompanionAdminPosts(accessToken, limit = 80) {
  const res = await fetch(`${API_BASE}/api/companion/admin/posts?limit=${encodeURIComponent(String(limit))}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function patchCompanionAdminPostModeration(postId, status, note, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/admin/posts/${postId}/moderate`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ status, note }),
  });
  return parseApiResponse(res);
}

export async function deleteCompanionAdminPost(postId, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/admin/posts/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  return parseApiResponse(res);
}

export async function fetchCompanionAdminUsers(accessToken, limit = 120, q = '') {
  const search = q ? `&q=${encodeURIComponent(String(q))}` : '';
  const res = await fetch(
    `${API_BASE}/api/companion/admin/users?limit=${encodeURIComponent(String(limit))}${search}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return parseApiResponse(res);
}

export async function fetchCompanionAdminAudit(accessToken, limit = 120) {
  const res = await fetch(`${API_BASE}/api/companion/admin/audit?limit=${encodeURIComponent(String(limit))}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function patchCompanionAdminUserRoles(userId, payload, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/admin/users/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  return parseApiResponse(res);
}

export async function patchCompanionAdminUserRolesByEmail(email, payload, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/admin/users/by-email`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ email, ...payload }),
  });
  return parseApiResponse(res);
}

export async function inviteCompanionAdminUser(email, role, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/admin/invite`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ email, role }),
  });
  return parseApiResponse(res);
}

export async function fetchCompanionAdminInvites(accessToken, limit = 120) {
  const res = await fetch(`${API_BASE}/api/companion/admin/invites?limit=${encodeURIComponent(String(limit))}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function cancelCompanionAdminInvite(inviteId, accessToken) {
  const res = await fetch(`${API_BASE}/api/companion/admin/invites/${inviteId}/cancel`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
  });
  return parseApiResponse(res);
}

export async function searchCompanionAdminUsersByName(query, accessToken, options = {}) {
  const q = encodeURIComponent(String(query || ''));
  const l = encodeURIComponent(String(options.limit || 12));
  const country = options.country ? `&country=${encodeURIComponent(String(options.country))}` : '';
  const availability = options.availability
    ? `&availability=${encodeURIComponent(String(options.availability))}`
    : '';
  const sort = options.sort ? `&sort=${encodeURIComponent(String(options.sort))}` : '';
  const res = await fetch(
    `${API_BASE}/api/companion/admin/users/search-by-name?q=${q}&limit=${l}${country}${availability}${sort}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return parseApiResponse(res);
}
