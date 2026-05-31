import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchCustomCells() {
  const { data, error } = await supabase
    .from('cells')
    .select('id, slug, name, description, language, created_by, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    if (/relation.*cells.*does not exist/i.test(error.message || '')) return [];
    throw error;
  }
  return data || [];
}

export async function createCell({ name, description, language }, accessToken) {
  const res = await fetch(`${API_BASE}/api/cells`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, description, language }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'cells_create_failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data.cell;
}
