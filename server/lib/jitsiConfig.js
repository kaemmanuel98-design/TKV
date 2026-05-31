import { config } from '../config.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export function isLocalJitsiHost(hostOrUrl) {
  if (!hostOrUrl) return false;
  try {
    const host = hostOrUrl.includes('://')
      ? new URL(hostOrUrl).hostname
      : hostOrUrl.split(':')[0];
    return LOCAL_HOSTS.has(host.toLowerCase());
  } catch {
    return hostOrUrl.includes('localhost') || hostOrUrl.includes('127.0.0.1');
  }
}

export function isJitsiCredentialsComplete() {
  return Boolean(config.jitsiDomain && config.jitsiAppId && config.jitsiAppSecret && config.jitsiJwtSub);
}

/** Jitsi utilisable en production (domaine public + JWT, pas de localhost ni jit.si). */
export function isJitsiProductionReady() {
  if (!isJitsiCredentialsComplete()) return false;
  if (isLocalJitsiHost(config.jitsiDomain) || isLocalJitsiHost(config.jitsiPublicUrl)) {
    return false;
  }
  const pub = config.jitsiPublicUrl || '';
  if (!pub.startsWith('https://')) return false;
  return true;
}

export function getJitsiRuntimeStatus() {
  const credentials = isJitsiCredentialsComplete();
  const productionReady = isJitsiProductionReady();
  const localHost = isLocalJitsiHost(config.jitsiDomain) || isLocalJitsiHost(config.jitsiPublicUrl);

  let mode = 'disabled';
  if (credentials && (!config.isProduction || productionReady)) {
    mode = 'secured';
  } else if (!config.isProduction && config.jitsiAllowPublicFallback) {
    mode = 'fallback';
  }

  const warnings = [];
  if (config.isProduction && config.jitsiAllowPublicFallback) {
    warnings.push('fallback_forced_off_in_production');
  }
  if (config.isProduction && localHost) {
    warnings.push('localhost_not_allowed_in_production');
  }
  if (config.isProduction && credentials && !productionReady) {
    warnings.push('jitsi_not_production_ready');
  }

  return {
    mode,
    configured: credentials,
    productionReady,
    available: mode === 'secured' || mode === 'fallback',
    publicUrl: config.jitsiPublicUrl || null,
    domain: config.jitsiDomain || null,
    fallbackEnabled: Boolean(config.jitsiAllowPublicFallback),
    warnings,
  };
}
