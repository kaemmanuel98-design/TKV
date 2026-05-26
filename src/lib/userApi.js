const API_BASE = import.meta.env.VITE_API_URL || '';

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'request_failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }
  if (!res.ok) {
    const err = new Error('request_failed');
    err.status = res.status;
    throw err;
  }
  return res;
}

export async function exportUserData(accessToken) {
  const res = await fetch(`${API_BASE}/api/user/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const parsed = await parseResponse(res);
  return parsed;
}

export async function deleteUserAccount(accessToken) {
  const res = await fetch(`${API_BASE}/api/user`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseResponse(res);
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
