import crypto from 'crypto';
import { config } from '../config.js';
import { getJitsiRuntimeStatus, isJitsiCredentialsComplete } from './jitsiConfig.js';

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
  const isMod = Boolean(moderator);
  const payload = {
    aud: jitsiAppId,
    iss: jitsiAppId,
    sub: jitsiJwtSub,
    // Modérateur : salle wildcard (salles TKV renouvelées chaque jour).
    // Participant : salle exacte uniquement.
    room: isMod ? '*' : room,
    exp: now + 60 * 60,
    nbf: now - 10,
    moderator: isMod,
    context: {
      user: {
        id: userId,
        name: displayName || 'Membre TKV',
        moderator: isMod,
        affiliation: isMod ? 'owner' : 'member',
      },
      ...(isMod
        ? {
            features: {
              livestreaming: false,
              recording: false,
              transcription: false,
              'outbound-call': false,
            },
          }
        : {}),
    },
  };

  const token = signHs256(payload, jitsiAppSecret, jitsiAppId);
  return token;
}

const EMBED_CONFIG = [
  'config.prejoinPageEnabled=false',
  'config.enableLobby=false',
  'config.hideLobbyButton=true',
  'config.lobby.autoKnock=false',
  'config.disableDeepLinking=true',
  'config.disableInviteFunctions=true',
  'config.enableWelcomePage=false',
  'config.enableClosePage=false',
  'config.requireDisplayName=false',
  'config.enableInsecureRoomNameWarning=false',
  'config.enableLobbyChat=false',
  'config.hideConferenceSubject=true',
  'config.startWithAudioMuted=false',
  'config.startWithVideoMuted=false',
  'interfaceConfig.APP_NAME=TKV',
  'interfaceConfig.NATIVE_APP_NAME=TKV',
  'interfaceConfig.SHOW_JITSI_WATERMARK=false',
  'interfaceConfig.MOBILE_APP_PROMO=false',
  'interfaceConfig.SHOW_PREJOIN_PAGE=false',
].join('&');

export function buildEmbedUrl({ publicUrl, room, jwt, displayName, canHost = false }) {
  const base = `${publicUrl.replace(/\/$/, '')}/${encodeURIComponent(room)}`;
  const parts = [];
  if (jwt) parts.push(`jwt=${jwt}`);
  if (displayName) {
    parts.push(`userInfo.displayName=${encodeURIComponent(displayName)}`);
  }
  if (canHost) {
    parts.push('config.startAudioOnly=false');
  }
  parts.push(EMBED_CONFIG);
  return `${base}#${parts.join('&')}`;
}

export function resolveJitsiJoin({ cellSlug, userId, displayName, canHost = false }) {
  const room = buildSecureRoomName(cellSlug);
  const status = getJitsiRuntimeStatus();

  if (status.mode === 'secured' && isJitsiCredentialsComplete()) {
    const jwt = createJitsiJwt({
      room,
      userId,
      displayName,
      moderator: canHost,
    });
    if (!jwt) {
      return { mode: 'disabled', reason: 'jwt_failed' };
    }
    return {
      mode: 'secured',
      room,
      domain: config.jitsiDomain,
      embedUrl: buildEmbedUrl({
        publicUrl: config.jitsiPublicUrl,
        room,
        jwt,
        displayName,
        canHost,
      }),
      canHost,
      role: canHost ? 'host' : 'participant',
    };
  }

  if (status.mode === 'fallback' && config.jitsiAllowPublicFallback) {
    const publicUrl = 'https://meet.jit.si';
    return {
      mode: 'fallback',
      room,
      domain: 'meet.jit.si',
      embedUrl: buildEmbedUrl({
        publicUrl,
        room,
        jwt: null,
        displayName,
        canHost,
      }),
      canHost,
      role: canHost ? 'host' : 'participant',
      warning: 'public_jitsi',
    };
  }

  return {
    mode: 'disabled',
    reason: config.isProduction ? 'production_not_configured' : 'not_configured',
  };
}
