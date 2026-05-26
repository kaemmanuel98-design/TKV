import crypto from 'crypto';
import { config } from '../config.js';

function base64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/** Nom de salle non devinable, renouvelé chaque jour. */
export function buildSecureRoomName(cellSlug) {
  const day = new Date().toISOString().slice(0, 10);
  const secret = config.jitsiRoomSecret || config.supabaseServiceKey || 'tkv-dev-change-me';
  const hash = crypto.createHmac('sha256', secret).update(`${cellSlug}:${day}`).digest('hex').slice(0, 20);
  return `tkv-${cellSlug}-${hash}`;
}

function signHs256(payload, secret, kid) {
  const header = { alg: 'HS256', typ: 'JWT', kid };
  const h = base64urlJson(header);
  const p = base64urlJson(payload);
  const sig = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${sig}`;
}

/**
 * Jeton Jitsi (serveur auto-hébergé avec prosody JWT).
 * @see docs/JITSI_SECURITE.md
 */
export function createJitsiJwt({ room, userId, displayName, moderator = false }) {
  const { jitsiAppId, jitsiAppSecret, jitsiJwtSub } = config;
  if (!jitsiAppId || !jitsiAppSecret || !jitsiJwtSub) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    // Jitsi (Prosody/JWT) attend généralement aud/iss = `JWT_APP_ID`
    aud: jitsiAppId,
    iss: jitsiAppId,
    sub: jitsiJwtSub,
    room,
    exp: now + 60 * 60,
    nbf: now - 10,
    context: {
      user: {
        id: userId,
        name: displayName || 'Membre TKV',
        moderator: moderator ? 'true' : 'false',
      },
    },
  };

  const token = signHs256(payload, jitsiAppSecret, jitsiAppId);
  return token;
}

const EMBED_CONFIG = [
  'config.prejoinPageEnabled=false',
  'config.disableDeepLinking=true',
  'config.disableInviteFunctions=true',
  'config.enableWelcomePage=false',
  'config.hideConferenceSubject=true',
  'interfaceConfig.APP_NAME=TKV',
  'interfaceConfig.NATIVE_APP_NAME=TKV',
  'interfaceConfig.SHOW_JITSI_WATERMARK=false',
  'interfaceConfig.MOBILE_APP_PROMO=false',
].join('&');

export function buildEmbedUrl({ publicUrl, room, jwt }) {
  const base = `${publicUrl.replace(/\/$/, '')}/${encodeURIComponent(room)}`;
  const q = jwt ? `jwt=${jwt}` : '';
  const hash = q ? `${q}&${EMBED_CONFIG}` : EMBED_CONFIG;
  return `${base}#${hash}`;
}

export function resolveJitsiJoin({ cellSlug, userId, displayName, isPremium }) {
  const room = buildSecureRoomName(cellSlug);

  if (config.jitsiDomain && config.jitsiAppId && config.jitsiAppSecret) {
    const jwt = createJitsiJwt({
      room,
      userId,
      displayName,
      moderator: isPremium,
    });
    return {
      mode: 'secured',
      room,
      domain: config.jitsiDomain,
      embedUrl: buildEmbedUrl({ publicUrl: config.jitsiPublicUrl, room, jwt }),
    };
  }

  if (config.jitsiAllowPublicFallback) {
    const publicUrl = 'https://meet.jit.si';
    return {
      mode: 'fallback',
      room,
      domain: 'meet.jit.si',
      embedUrl: buildEmbedUrl({ publicUrl, room, jwt: null }),
      warning: 'public_jitsi',
    };
  }

  return { mode: 'disabled' };
}
