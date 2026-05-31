import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  if (!m) return '';
  return m[1].trim().replace(/^["']|["']$/g, '');
};

const url = get('VITE_SUPABASE_URL');
const key = get('VITE_SUPABASE_ANON_KEY');
const svc = get('SUPABASE_SERVICE_ROLE_KEY');

let hostOk = false;
try {
  const u = new URL(url);
  hostOk = u.protocol === 'https:' && u.hostname.endsWith('.supabase.co');
} catch {
  hostOk = false;
}

const urlOk = Boolean(url) && !url.includes('your-project');
const keyOk = Boolean(key) && key.length > 20 && !key.includes('your-anon');
const svcOk = Boolean(svc) && svc.length > 20 && !svc.includes('your-service');

console.log('VITE_SUPABASE_URL:', urlOk ? 'ok' : 'manquant ou placeholder');
console.log('VITE_SUPABASE_ANON_KEY:', keyOk ? 'ok' : 'manquant ou placeholder');
console.log('SUPABASE_SERVICE_ROLE_KEY:', svcOk ? 'ok' : 'manquant (API paiements)');
console.log('host:', hostOk ? 'ok (.supabase.co)' : 'invalide');
console.log('frontend_ready:', urlOk && keyOk && hostOk);
if (urlOk && hostOk) {
  console.log('project_ref:', new URL(url).hostname.split('.')[0]);
}
if (urlOk && keyOk && hostOk) {
  console.log('');
  console.log('Next: npm run dev:api  +  npm run dev  (redémarrer les deux après .env)');
  console.log('SQL: exécuter supabase_certificates_payments.sql dans Supabase');
}
