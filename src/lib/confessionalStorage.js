const PREFIX = 'tkv_confessional_v1';

function storageKey(userId) {
  return `${PREFIX}:${userId}`;
}

function readAll(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(userId, rows) {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(rows));
  } catch {
    /* quota */
  }
}

function newId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isConfessionTableMissing(error) {
  const msg = (error?.message || '').toLowerCase();
  const code = error?.code || '';
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /relation.*confession_sessions.*does not exist/i.test(msg) ||
    /could not find the table.*confession_sessions/i.test(msg)
  );
}

export function listLocalConfessionSessions(userId) {
  return readAll(userId).sort(
    (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  );
}

export function createLocalConfessionSession(userId) {
  const now = new Date().toISOString();
  const row = {
    id: newId(),
    user_id: userId,
    created_at: now,
    updated_at: now,
    examen_thankful: null,
    examen_review: null,
    examen_growth: null,
    confession_text: null,
    resolution_text: null,
    grace_verse_key: null,
    grace_word: null,
    completed: false,
    _local: true,
  };
  const rows = readAll(userId);
  rows.unshift(row);
  writeAll(userId, rows);
  return row;
}

export function updateLocalConfessionSession(userId, sessionId, patch) {
  const rows = readAll(userId);
  const idx = rows.findIndex((r) => r.id === sessionId);
  if (idx < 0) throw new Error('confession_session_not_found');
  const updated = {
    ...rows[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  rows[idx] = updated;
  writeAll(userId, rows);
  return updated;
}

export function deleteLocalConfessionSession(userId, sessionId) {
  const rows = readAll(userId).filter((r) => r.id !== sessionId);
  writeAll(userId, rows);
}

/** Fusionne cloud + local en privilégiant le cloud quand les deux existent. */
export function mergeConfessionSessions(cloudRows = [], localRows = []) {
  const byId = new Map();
  for (const row of localRows) byId.set(row.id, row);
  for (const row of cloudRows) byId.set(row.id, { ...row, _local: false });
  return [...byId.values()].sort(
    (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  );
}
