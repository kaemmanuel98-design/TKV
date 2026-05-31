import { API_BASE, parseApiResponse } from './apiClient.js';

export async function exportUserData(accessToken) {
  const res = await fetch(`${API_BASE}/api/user/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function deleteUserAccount(accessToken) {
  const res = await fetch(`${API_BASE}/api/user`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export function downloadJsonExport(data, filename = 'tkv-export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
