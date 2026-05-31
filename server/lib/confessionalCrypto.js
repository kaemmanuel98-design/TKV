import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function masterKey() {
  const raw = process.env.CONFESSIONAL_ENCRYPTION_KEY || '';
  if (!raw || raw.length < 16) return null;
  return createHash('sha256').update(raw, 'utf8').digest();
}

function deriveKey(scopeId) {
  const master = masterKey();
  if (!master) return null;
  return createHash('sha256')
    .update(master)
    .update(String(scopeId || ''))
    .digest();
}

export function encryptionEnabled() {
  return Boolean(masterKey());
}

export function encryptConfessionalContent(plaintext, sessionId) {
  const text = String(plaintext ?? '');
  const key = deriveKey(sessionId);
  if (!key) return text;

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, tag, enc]).toString('base64url');
  return `${PREFIX}${blob}`;
}

export function decryptConfessionalContent(stored, sessionId) {
  const raw = String(stored ?? '');
  if (!raw.startsWith(PREFIX)) return raw;

  const key = deriveKey(sessionId);
  if (!key) return raw;

  try {
    const buf = Buffer.from(raw.slice(PREFIX.length), 'base64url');
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return '[contenu illisible]';
  }
}

export function encryptCompanionChatContent(plaintext, requestId) {
  return encryptConfessionalContent(plaintext, `companion:${requestId}`);
}

export function decryptCompanionChatContent(stored, requestId) {
  return decryptConfessionalContent(stored, `companion:${requestId}`);
}
