import 'dotenv/config';
import { getJitsiRuntimeStatus, isLocalJitsiHost } from '../server/lib/jitsiConfig.js';

const status = getJitsiRuntimeStatus();
const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

console.log('JITSI_DOMAIN:', process.env.JITSI_DOMAIN || '(vide)');
console.log('JITSI_PUBLIC_URL:', process.env.JITSI_PUBLIC_URL || '(vide)');
console.log('JITSI_APP_ID:', process.env.JITSI_APP_ID ? 'ok' : 'manquant');
console.log('JITSI_APP_SECRET:', process.env.JITSI_APP_SECRET ? 'ok' : 'manquant');
console.log('JITSI_JWT_SUB:', process.env.JITSI_JWT_SUB || process.env.JITSI_DOMAIN || '(vide)');
console.log('JITSI_ROOM_SECRET:', process.env.JITSI_ROOM_SECRET ? 'ok' : 'manquant (recommandé)');
console.log('JITSI_ALLOW_PUBLIC_FALLBACK:', process.env.JITSI_ALLOW_PUBLIC_FALLBACK || 'auto');
console.log('');
console.log('mode:', status.mode);
console.log('configured:', status.configured);
console.log('productionReady:', status.productionReady);
console.log('available:', status.available);
if (status.warnings.length) console.log('warnings:', status.warnings.join(', '));

if (isLocalJitsiHost(process.env.JITSI_DOMAIN) && isProd) {
  console.log('\n⚠ localhost interdit en production — utilisez meet.votredomaine.org');
  process.exit(1);
}

if (isProd && !status.productionReady) {
  console.log('\n⚠ Visio prod non prête — voir docs/JITSI_PRODUCTION.md');
  process.exit(1);
}

if (status.mode === 'secured') {
  console.log('\nOK — Jitsi prêt.');
  process.exit(0);
}

console.log('\nInfo — dev : lancez setup-jitsi-windows ou configurez le VPS.');
process.exit(status.mode === 'fallback' ? 0 : 1);
