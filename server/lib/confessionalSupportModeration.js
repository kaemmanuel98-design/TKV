/** Règles minimales cercles de soutien — pas de contact direct. */
const BLOCKED = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /\bhttps?:\/\//i,
  /\bwww\./i,
  /\b(?:\+?\d[\d\s.-]{8,}\d)\b/,
  /\b(?:whatsapp|telegram|signal|snap|instagram|facebook|tiktok)\b/i,
];

export function validateSupportCircleMessage(text) {
  const body = String(text || '').trim();
  if (!body) {
    const err = new Error('message_invalid');
    err.code = 'message_invalid';
    throw err;
  }
  for (const re of BLOCKED) {
    if (re.test(body)) {
      const err = new Error('message_blocked');
      err.code = 'message_blocked';
      throw err;
    }
  }
  return body;
}
