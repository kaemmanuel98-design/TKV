const PREFIX = 'tkv_confessional_draft_v1';

export function loadChatDraft(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveChatDraft(userId, draft) {
  if (!userId) return;
  try {
    localStorage.setItem(`${PREFIX}:${userId}`, JSON.stringify(draft));
  } catch {
    /* quota */
  }
}

export function clearChatDraft(userId) {
  if (!userId) return;
  localStorage.removeItem(`${PREFIX}:${userId}`);
}
