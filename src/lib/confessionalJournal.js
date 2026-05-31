const PREFIX = 'tkv_confessional_journal_v1';

export function loadJournalEntries(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${PREFIX}:${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveJournalEntry(userId, text) {
  if (!userId || !text?.trim()) return null;
  const entries = loadJournalEntries(userId);
  const entry = {
    id: `j_${Date.now()}`,
    text: text.trim(),
    created_at: new Date().toISOString(),
  };
  entries.unshift(entry);
  localStorage.setItem(`${PREFIX}:${userId}`, JSON.stringify(entries.slice(0, 200)));
  return entry;
}

export function deleteJournalEntry(userId, entryId) {
  const entries = loadJournalEntries(userId).filter((e) => e.id !== entryId);
  localStorage.setItem(`${PREFIX}:${userId}`, JSON.stringify(entries));
}
